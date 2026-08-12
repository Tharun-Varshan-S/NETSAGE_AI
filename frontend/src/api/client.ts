const API_BASE = 'http://localhost:8000/api';

export const fetchCases = async () => {
    const res = await fetch(`${API_BASE}/cases`);
    return res.json();
};

export const fetchCase = async (id: number) => {
    const res = await fetch(`${API_BASE}/cases/${id}`);
    return res.json();
};

export const diagnoseCase = async (id: number) => {
    const res = await fetch(`${API_BASE}/diagnose/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const submitCommandOutput = async (id: number, command_executed: string, output: string) => {
    const res = await fetch(`${API_BASE}/diagnose/${id}/command-output`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command_executed, output })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const submitReview = async (id: number, status: string, reason: string) => {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
    });
    return res.json();
};

export const fetchDashboardStats = async () => {
    const res = await fetch(`${API_BASE}/dashboard`);
    return res.json();
};
