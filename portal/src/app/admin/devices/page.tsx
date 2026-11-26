'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { Cpu, Plus, KeyRound } from 'lucide-react';

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ device_id: '', name: '', device_type: 'kiosk', campus: 'Main Campus', classroom: '' });
  const [secretBanner, setSecretBanner] = useState('');
  const [error, setError] = useState('');

  const loadDevices = useCallback(async () => {
    try {
      const res = await api.admin.devices.list();
      setDevices(res?.devices || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load devices.');
    }
  }, []);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.admin.devices.register(form);
      setSecretBanner(`Device ${form.device_id} registered. One-time secret: ${res.device_secret}`);
      setShowAdd(false);
      setForm({ device_id: '', name: '', device_type: 'kiosk', campus: 'Main Campus', classroom: '' });
      loadDevices();
    } catch (err: any) {
      setError(err?.message || 'Failed to register device.');
    }
  };

  const handleRotate = async (id: string, devId: string) => {
    try {
      const res = await api.admin.devices.rotateCredential(id);
      setSecretBanner(`Rotated secret for ${devId}: ${res.device_secret}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to rotate credential.');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Hardware Fleet"
        title="Campus Device Management"
        subtitle="Register attendance terminals, kiosks, and cameras with scoped credentials and status controls."
        actions={<Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Register Device</Button>}
      />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>}
      {secretBanner && <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-xs text-amber-200">{secretBanner}</div>}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-faint font-mono uppercase">
                <th className="py-3 px-3">Device</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Campus / Room</th>
                <th className="py-3 px-3">Last Heartbeat</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {devices.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-faint">No campus devices registered yet.</td></tr>
              ) : devices.map((d) => (
                <tr key={d.id}>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-white flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-accent" /> {d.name}</p>
                    <p className="font-mono text-[11px] text-faint">{d.device_id}</p>
                  </td>
                  <td className="py-3 px-3 uppercase font-mono">{d.device_type}</td>
                  <td className="py-3 px-3">{d.campus} / {d.classroom || 'Unassigned'}</td>
                  <td className="py-3 px-3 text-faint">{d.last_heartbeat ? new Date(d.last_heartbeat).toLocaleString() : '—'}</td>
                  <td className="py-3 px-3"><Badge tone={d.status === 'active' ? 'success' : 'warning'}>{d.status}</Badge></td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button onClick={() => handleRotate(d.id, d.device_id)} className="rounded bg-white/5 px-2 py-1 text-accent hover:bg-white/10" title="Rotate Secret">
                      <KeyRound className="h-3.5 w-3.5 inline" />
                    </button>
                    <button
                      onClick={() => api.admin.devices.update(d.id, { status: d.status === 'active' ? 'suspended' : 'active' }).then(loadDevices)}
                      className="rounded bg-white/5 px-2.5 py-1 text-gray-300 hover:bg-white/10"
                    >
                      {d.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Register Campus Device">
        <form onSubmit={handleRegister} className="space-y-3 text-xs">
          <input required placeholder="Device Identifier (e.g. KIOSK-LH101)" value={form.device_id} onChange={(e) => setForm({ ...form, device_id: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <input required placeholder="Device Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <select value={form.device_type} onChange={(e) => setForm({ ...form, device_type: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white">
            <option value="kiosk">Classroom Kiosk</option>
            <option value="terminal">Attendance Terminal</option>
            <option value="usb_camera">USB Camera Station</option>
            <option value="ip_camera">IP Camera</option>
            <option value="edge_node">Edge Compute Node</option>
          </select>
          <input placeholder="Campus" value={form.campus} onChange={(e) => setForm({ ...form, campus: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <input placeholder="Classroom / Location" value={form.classroom} onChange={(e) => setForm({ ...form, classroom: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit">Register</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
