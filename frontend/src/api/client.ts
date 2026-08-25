import type { Case, DiagnosisResponse, DashboardStats, Review } from '../types/case';

const API_BASE = 'http://localhost:8000/api';

const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
    const token = localStorage.getItem('token');
    return {
        ...extraHeaders,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        let errorDetail = '';
        try {
            const errData = await res.json();
            errorDetail = errData.detail || JSON.stringify(errData);
        } catch {
            errorDetail = await res.text();
        }
        throw new Error(errorDetail || `API request failed with status ${res.status}`);
    }
    return res.json();
};

export const login = async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
    });
    return handleResponse(res);
};

export const fetchCases = async (): Promise<Case[]> => {
    try {
        const res = await fetch(`${API_BASE}/cases/`, {
            headers: getAuthHeaders()
        });
        return await handleResponse(res);
    } catch (err: any) {
        throw new Error(err.message || 'Backend is unavailable. Please verify the backend server is running.');
    }
};

export const createCase = async (
    symptom: string, 
    topology_note: string, 
    show_outputs: string
): Promise<Case> => {
    try {
        const res = await fetch(`${API_BASE}/cases/`, {
            method: 'POST',
            headers: getAuthHeaders({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }),
            body: JSON.stringify({ symptom, topology_note, show_outputs })
        });
        return await handleResponse(res);
    } catch (err: any) {
        throw new Error(err.message || 'Failed to create case. Ensure the backend is running.');
    }
};

export const fetchCase = async (id: number): Promise<Case> => {
    try {
        const res = await fetch(`${API_BASE}/cases/${id}`, {
            headers: getAuthHeaders()
        });
        return await handleResponse(res);
    } catch (err: any) {
        throw new Error(err.message || 'Backend is unavailable.');
    }
};

export const diagnoseCase = async (id: number): Promise<DiagnosisResponse> => {
    try {
        const res = await fetch(`${API_BASE}/diagnose/${id}`, { 
            method: 'POST',
            headers: getAuthHeaders({ 'Accept': 'application/json' })
        });
        return await handleResponse(res);
    } catch (err: any) {
        throw new Error(err.message || 'AI Diagnosis failed or server is offline.');
    }
};

export const submitCommandOutput = async (
    id: number, 
    command_executed: string, 
    output: string
): Promise<DiagnosisResponse> => {
    try {
        const res = await fetch(`${API_BASE}/diagnose/${id}/command-output`, {
            method: 'POST',
            headers: getAuthHeaders({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }),
            body: JSON.stringify({ command_executed, output })
        });
        return await handleResponse(res);
    } catch (err: any) {
        throw new Error(err.message || 'Failed to submit command output.');
    }
};

export const submitReview = async (
    id: number, 
    status: 'Accepted' | 'Edited' | 'Rejected', 
    reason: string
): Promise<Review> => {
    try {
        const res = await fetch(`${API_BASE}/reviews/${id}`, {
            method: 'POST',
            headers: getAuthHeaders({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }),
            body: JSON.stringify({ status, reason })
        });
        return await handleResponse(res);
    } catch (err: any) {
        throw new Error(err.message || 'Failed to submit review.');
    }
};

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
    try {
        const res = await fetch(`${API_BASE}/dashboard/`, {
            headers: getAuthHeaders()
        });
        return await handleResponse(res);
    } catch (err: any) {
        throw new Error(err.message || 'Failed to load dashboard statistics.');
    }
};
