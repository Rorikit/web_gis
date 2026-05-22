import type { Damage, GisPoint, Order, User } from '@/entities';
import { mockAudit, mockDamages, mockOrders, mockUsers } from './mock-data';

let currentUser: User | null = mockUsers[0];
let damages = [...mockDamages];
let orders = [...mockOrders];
let users = [...mockUsers];

const wait = async () => new Promise((resolve) => window.setTimeout(resolve, 250));

export const mockStore = {
  async login(ldapLogin: string) {
    await wait();
    const user = users.find((item) => item.ldapLogin === ldapLogin) ?? users[0];
    if (!user.isActive) throw new Error('Пользователь заблокирован');
    currentUser = user;
    return user;
  },
  async logout() {
    await wait();
    currentUser = null;
  },
  async me() {
    await wait();
    return currentUser;
  },
  async listDamages(archived = false) {
    await wait();
    return damages.filter((item) => item.archived === archived);
  },
  async getDamage(id: string) {
    await wait();
    return damages.find((item) => item.id === id) ?? null;
  },
  async createDamage(payload: Partial<Damage>) {
    await wait();
    const damage = { ...damages[0], ...payload, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), archived: false };
    damages = [damage, ...damages];
    return damage;
  },
  async updateDamage(id: string, payload: Partial<Damage>) {
    await wait();
    damages = damages.map((item) => (item.id === id ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item));
    return damages.find((item) => item.id === id)!;
  },
  async archiveDamage(id: string) {
    return this.updateDamage(id, { archived: true });
  },
  async listOrders(archived = false) {
    await wait();
    return orders.filter((item) => item.archived === archived);
  },
  async getOrder(id: string) {
    await wait();
    return orders.find((item) => item.id === id) ?? null;
  },
  async updateOrder(id: string, payload: Partial<Order>) {
    await wait();
    orders = orders.map((item) => (item.id === id ? { ...item, ...payload, updatedAt: new Date().toISOString() } : item));
    return orders.find((item) => item.id === id)!;
  },
  async archiveOrder(id: string) {
    return this.updateOrder(id, { archived: true });
  },
  async saveDamagePoint(id: string, point: Omit<GisPoint, 'id' | 'address' | 'gisObjectId' | 'mapUrl'>) {
    const damage = await this.getDamage(id);
    if (!damage) throw new Error('Повреждение не найдено');
    const gisPoint: GisPoint = {
      id: crypto.randomUUID(),
      address: damage.address,
      latitude: point.latitude,
      longitude: point.longitude,
      gisObjectId: `GIS-${Date.now()}`,
      mapUrl: '#',
    };
    return this.updateDamage(id, { gisPoint });
  },
  async audit(entityType: string, entityId: string) {
    await wait();
    return mockAudit.filter((item) => item.entityType === entityType && item.entityId === entityId);
  },
  async users() {
    await wait();
    return users;
  },
  async updateUser(id: string, payload: Partial<User>) {
    await wait();
    users = users.map((item) => (item.id === id ? { ...item, ...payload } : item));
    return users.find((item) => item.id === id)!;
  },
};
