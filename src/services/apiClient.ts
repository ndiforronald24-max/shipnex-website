import type { CreateOfficeRequest, UpdateOfficeRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  private loadToken(): void {
    this.token = localStorage.getItem('authToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401 && !response.url.includes('/auth/')) {
      this.clearToken();
      window.location.href = '/login';
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw { response: { data: error, status: response.status } };
    }
    return response.json();
  }

  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  public getToken(): string | null {
    return this.token;
  }

  public clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Auth
  public async login(email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify({ email, password })
    });
    return this.handleResponse(res);
  }

  public async register(firstName: string, lastName: string, email: string, password: string, phone?: string, address?: string) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify({ firstName, lastName, email, password, phone, address })
    });
    return this.handleResponse(res);
  }

  // Shipments
  public async getShipmentTracking(trackingNumber: string) {
    return this.publicTrack(trackingNumber);
  }

  // Unified public tracking: GET /api/tracking/{trackingNumber} — no account required.
  // Response envelope: { type: 'shipment' | 'pet', result: {...} }
  public async publicTrack(trackingNumber: string) {
    const res = await fetch(`${API_BASE_URL}/tracking/${encodeURIComponent(trackingNumber.trim())}`);
    if (res.status === 404) {
      throw { response: { data: { message: "We couldn't find a shipment with that tracking number. Please check the number and try again." }, status: 404 } };
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Tracking request failed. Please try again.' }));
      throw { response: { data: error, status: res.status } };
    }
    return res.json();
  }

  public async getAllShipments() {
    const res = await fetch(`${API_BASE_URL}/shipments`, { headers: this.getHeaders() });
    return this.handleResponse(res);
  }

  public async createShipment(data: any) {
    const res = await fetch(`${API_BASE_URL}/shipments`, {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return this.handleResponse(res);
  }

  public async deleteShipment(id: string) {
    const res = await fetch(`${API_BASE_URL}/shipments/${id}`, {
      method: 'DELETE', headers: this.getHeaders()
    });
    return this.handleResponse(res);
  }

  // Customers
  public async getAllCustomers() {
    const res = await fetch(`${API_BASE_URL}/customers`, { headers: this.getHeaders() });
    return this.handleResponse(res);
  }

  public async deleteCustomer(id: string) {
    const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE', headers: this.getHeaders()
    });
    return this.handleResponse(res);
  }

  // Pets
  public async getPetTracking(trackingNumber: string) {
    const envelope = await this.publicTrack(trackingNumber);
    if (envelope?.type && envelope.type !== 'pet') {
      throw { response: { data: { message: "We couldn't find a shipment with that tracking number. Please check the number and try again." }, status: 404 } };
    }
    return envelope;
  }

  public async getAllPets() {
    const res = await fetch(`${API_BASE_URL}/pets`, { headers: this.getHeaders() });
    return this.handleResponse(res);
  }

  public async deletePetShipment(id: string) {
    const res = await fetch(`${API_BASE_URL}/pets/${id}`, {
      method: 'DELETE', headers: this.getHeaders()
    });
    return this.handleResponse(res);
  }

  public async createPetShipment(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE_URL}/pets`, {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return this.handleResponse(res);
  }

  public async updatePetShipment(id: string, data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE_URL}/pets/${id}`, {
      method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return this.handleResponse(res);
  }

  public async updatePetStatus(id: string, data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE_URL}/pets/${id}/status`, {
      method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return this.handleResponse(res);
  }

  public async updatePetLocation(id: string, data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE_URL}/pets/${id}/location`, {
      method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return this.handleResponse(res);
  }

  public async addPetCareEvent(id: string, data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE_URL}/pets/${id}/care-events`, {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return this.handleResponse(res);
  }

  public async addPetDocument(id: string, data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE_URL}/pets/${id}/documents`, {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data)
    });
    return this.handleResponse(res);
  }

  public async setPetDocumentVisibility(id: string, documentId: string, customerVisible: boolean) {
    const res = await fetch(`${API_BASE_URL}/pets/${id}/documents/${documentId}/visibility`, {
      method: 'PUT', headers: this.getHeaders(),
      body: JSON.stringify({ customerVisible })
    });
    return this.handleResponse(res);
  }

  // Offices
  public async getAllOffices(filters?: { region?: string; country?: string; city?: string }) {
    const params = new URLSearchParams();
    if (filters?.region) params.append('region', filters.region);
    if (filters?.country) params.append('country', filters.country);
    if (filters?.city) params.append('city', filters.city);
    const query = params.toString();
    const res = await fetch(`${API_BASE_URL}/offices${query ? `?${query}` : ''}`, { headers: this.getHeaders() });
    return this.handleResponse(res);
  }

  public async getOfficeById(id: string) {
    const res = await fetch(`${API_BASE_URL}/offices/${id}`, { headers: this.getHeaders() });
    return this.handleResponse(res);
  }

  public async getOfficeRegions() {
    const res = await fetch(`${API_BASE_URL}/offices/regions`, { headers: this.getHeaders() });
    return this.handleResponse(res);
  }

  public async getOfficeCountries(region?: string) {
    const query = region ? `?region=${encodeURIComponent(region)}` : '';
    const res = await fetch(`${API_BASE_URL}/offices/countries${query}`, { headers: this.getHeaders() });
    return this.handleResponse(res);
  }

  public async createOffice(data: CreateOfficeRequest) {
    return this.post('/offices', data);
  }

  public async updateOffice(id: string, data: UpdateOfficeRequest) {
    return this.put(`/offices/${id}`, data);
  }

  public async deleteOffice(id: string) {
    return this.del(`/offices/${id}`);
  }

  public async deactivateOffice(id: string) {
    return this.post(`/offices/${id}/deactivate`, {});
  }

  // ---------- Generic request helpers ----------
  public async get(url: string) {
    const res = await fetch(`${API_BASE_URL}${url}`, { headers: this.getHeaders() });
    return this.handleResponse(res);
  }

  public async post(url: string, data: unknown) {
    const res = await fetch(`${API_BASE_URL}${url}`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify(data) });
    return this.handleResponse(res);
  }

  public async put(url: string, data: unknown) {
    const res = await fetch(`${API_BASE_URL}${url}`, { method: 'PUT', headers: this.getHeaders(), body: JSON.stringify(data) });
    return this.handleResponse(res);
  }

  public async patch(url: string, data: unknown) {
    const res = await fetch(`${API_BASE_URL}${url}`, { method: 'PATCH', headers: this.getHeaders(), body: JSON.stringify(data) });
    return this.handleResponse(res);
  }

  public async del(url: string) {
    const res = await fetch(`${API_BASE_URL}${url}`, { method: 'DELETE', headers: this.getHeaders() });
    return this.handleResponse(res);
  }

  // ---------- Admin ----------
  public async getAdminStats() {
    return this.get('/admin/stats');
  }

  public async getAuditLogs(count = 100) {
    return this.get(`/admin/audit-logs?count=${count}`);
  }

  public async getStaff() {
    return this.get('/admin/staff');
  }

  public async updateStaff(id: string, data: { role: string; isActive: boolean }) {
    return this.put(`/admin/staff/${id}`, data);
  }

  // ---------- Shipments (admin) ----------
  public async getShipment(id: string) {
    return this.get(`/shipments/${id}`);
  }

  public async getFilteredShipments(query: Record<string, string | number | undefined>) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== '') params.append(k, String(v)); });
    return this.get(`/shipments/filtered?${params.toString()}`);
  }

  /** Creates a tracking event; backend updates shipment, location, audit log, notifications. */
  public async addTrackingEvent(id: string, data: {
    status: string; locationName: string; latitude?: number; longitude?: number;
    description?: string; eventTime?: string;
  }) {
    return this.post(`/shipments/${id}/tracking-events`, data);
  }

  // ---------- Documents ----------
  public async getShipmentDocuments(shipmentId: string) {
    return this.get(`/documents/shipment/${shipmentId}`);
  }

  /** Document type catalogue served by the backend (authoritative list). */
  public async getDocumentTypes() {
    return this.get('/documents/types');
  }

  /**
   * Uploads a real file to secure private storage via the multipart endpoint.
   * Metadata (type, visibility, description) is sent as form fields alongside
   * the binary "file" part. Never send the service key or any secrets here.
   */
  public async uploadDocument(
    file: File,
    fields: { shipmentId: string; documentType: string; description?: string; customerVisible: boolean }
  ) {
    const form = new FormData();
    form.append('file', file);
    form.append('shipmentId', fields.shipmentId);
    form.append('documentType', fields.documentType);
    if (fields.description) form.append('description', fields.description);
    form.append('customerVisible', String(fields.customerVisible));

    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(`${API_BASE_URL}/documents/upload`, { method: 'POST', headers, body: form });
    return this.handleResponse(res);
  }

  /** Requests a short-lived signed access URL for a stored document. */
  public async getDocumentAccessUrl(id: string, expiresInSeconds = 300) {
    return this.get(`/documents/${id}/access-url?expiresInSeconds=${expiresInSeconds}`);
  }

  public async createDocument(data: {
    shipmentId: string; documentType: string; fileName: string; fileUrl: string;
    contentType: string; fileSize: number; description?: string; customerVisible: boolean;
  }) {
    return this.post('/documents', data);
  }

  public async updateDocumentVisibility(id: string, customerVisible: boolean) {
    return this.patch(`/documents/${id}/visibility`, { customerVisible });
  }

  public async deleteDocument(id: string) {
    return this.del(`/documents/${id}`);
  }

  // ---------- Vehicles ----------
  public async getAllVehicles() {
    return this.get('/vehicles');
  }

  public async createVehicle(data: Record<string, unknown>) {
    return this.post('/vehicles', data);
  }

  public async updateVehicle(id: string, data: Record<string, unknown>) {
    return this.put(`/vehicles/${id}`, data);
  }

  public async deleteVehicle(id: string) {
    return this.del(`/vehicles/${id}`);
  }

    // ---------- Customers (admin) ----------
  public async createCustomer(data: Record<string, unknown>) {
    return this.post('/customers', data);
  }

  public async updateCustomer(id: string, data: Record<string, unknown>) {
    return this.put(`/customers/${id}`, data);
  }
}

export const apiClient = new ApiClient();



