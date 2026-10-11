import { DriverAccessError } from '../application/driver-access-error';
import {
  Driver,
  DriverOrganization,
  emptyDriverDetails,
} from '../domain/driver';
import { DriverGateway } from './driver-gateway';
import { SupabaseDriverRepository } from './supabase-driver-repository';

const north: DriverOrganization = {
  id: 'org-north',
  name: 'North',
  currency: 'EGP',
};
const oldPhoto = {
  path: 'org-north/driver-1/old.webp',
  url: 'https://example.test/old',
};
const ahmed: Driver = {
  ...emptyDriverDetails,
  id: 'driver-1',
  fullName: 'Ahmed',
  photo: null,
};
const webp = new Blob(['photo'], { type: 'image/webp' });
const photoPath = /^org-north\/driver-1\/[0-9a-f-]{36}\.webp$/;

describe('SupabaseDriverRepository', () => {
  it('resolves the organization from the signed-in user memberships', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseDriverRepository(gateway);

    await expect(repository.organization('org-north')).resolves.toEqual(north);
    expect(gateway.membershipOrganizations).toHaveBeenCalledWith('user-1');
  });

  it('returns null for an organization outside the memberships', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseDriverRepository(gateway);

    await expect(repository.organization('org-south')).resolves.toBeNull();
    expect(gateway.listDrivers).not.toHaveBeenCalled();
  });

  it('asks a signed-out user to sign in', async () => {
    const gateway = fakeGateway(null, []);
    const repository = new SupabaseDriverRepository(gateway);

    await expect(repository.organization('org-north')).rejects.toEqual(
      new DriverAccessError('signedOut'),
    );
    expect(gateway.membershipOrganizations).not.toHaveBeenCalled();
  });

  it('lists drivers with the membership organization id', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseDriverRepository(gateway);

    const organization = await repository.organization('org-north');
    await repository.list(organization ?? north);

    expect(gateway.listDrivers).toHaveBeenCalledWith(north);
  });

  it('files a new photo under the organization and driver, then points the driver at it', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseDriverRepository(gateway);

    await repository.setPhoto(north, ahmed, webp);

    const [path, photo] = vi.mocked(gateway.uploadPhoto).mock.calls[0];
    expect(path).toMatch(photoPath);
    expect(photo).toBe(webp);
    expect(gateway.setPhotoPath).toHaveBeenCalledWith(north, 'driver-1', path);
    expect(gateway.deletePhoto).not.toHaveBeenCalled();
  });

  it('names a JPEG photo .jpg', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseDriverRepository(gateway);

    await repository.setPhoto(
      north,
      ahmed,
      new Blob(['photo'], { type: 'image/jpeg' }),
    );

    expect(vi.mocked(gateway.uploadPhoto).mock.calls[0][0]).toMatch(/\.jpg$/);
  });

  it('deletes the old photo once the new one is in place', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseDriverRepository(gateway);

    await repository.setPhoto(north, { ...ahmed, photo: oldPhoto }, webp);

    expect(gateway.deletePhoto).toHaveBeenCalledWith(oldPhoto.path);
  });

  it('deletes the uploaded file when the driver cannot point at it', async () => {
    const gateway = fakeGateway('user-1', [north]);
    vi.mocked(gateway.setPhotoPath).mockRejectedValue(
      new DriverAccessError('save'),
    );
    const repository = new SupabaseDriverRepository(gateway);

    await expect(
      repository.setPhoto(north, { ...ahmed, photo: oldPhoto }, webp),
    ).rejects.toEqual(new DriverAccessError('save'));

    const uploaded = vi.mocked(gateway.uploadPhoto).mock.calls[0][0];
    expect(gateway.deletePhoto).toHaveBeenCalledWith(uploaded);
    expect(gateway.deletePhoto).not.toHaveBeenCalledWith(oldPhoto.path);
  });

  it("reads the driver's trips and pay for the whole month, and the unopened days up to today", async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseDriverRepository(gateway);

    await repository.month(north, 'driver-1', '2026-02', '2026-02-10');

    const month = { from: '2026-02-01', to: '2026-02-28' };
    expect(gateway.tripLog).toHaveBeenCalledWith('org-north', 'driver-1', month, '2026-02-10');
    expect(gateway.driverPay).toHaveBeenCalledWith('org-north', 'driver-1', month, '2026-02-10');
    expect(gateway.unopenedDays).toHaveBeenCalledWith('org-north', {
      from: '2026-02-01',
      to: '2026-02-10',
    });
  });

  it('looks for no unopened days in a month that has not started', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseDriverRepository(gateway);

    const month = await repository.month(north, 'driver-1', '2026-03', '2026-02-10');

    expect(month.unopenedDays).toEqual([]);
    expect(gateway.unopenedDays).not.toHaveBeenCalled();
  });

  it('removes a photo from the driver and deletes its file', async () => {
    const gateway = fakeGateway('user-1', [north]);
    const repository = new SupabaseDriverRepository(gateway);

    await repository.removePhoto(north, { ...ahmed, photo: oldPhoto });

    expect(gateway.setPhotoPath).toHaveBeenCalledWith(north, 'driver-1', null);
    expect(gateway.deletePhoto).toHaveBeenCalledWith(oldPhoto.path);
  });
});

function fakeGateway(
  userId: string | null,
  memberships: DriverOrganization[],
): DriverGateway {
  return {
    sessionUserId: vi.fn(async () => userId),
    membershipOrganizations: vi.fn(async () => memberships),
    listDrivers: vi.fn(async () => []),
    findDriver: vi.fn(async () => ahmed),
    workChoices: vi.fn(async () => ({
      customers: [],
      routes: [],
      vehicles: [],
      drivers: [],
    })),
    driverRoutes: vi.fn(async () => []),
    tripLog: vi.fn(async () => []),
    driverPay: vi.fn(async () => null),
    unopenedDays: vi.fn(async () => []),
    insertDriver: vi.fn(),
    updateDriver: vi.fn(),
    uploadPhoto: vi.fn(async () => undefined),
    setPhotoPath: vi.fn(async () => ahmed),
    deletePhoto: vi.fn(async () => undefined),
  };
}
