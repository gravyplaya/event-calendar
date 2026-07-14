'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Search,
  QrCode,
  Users,
  TrendingUp,
  Copy,
  Check,
  Plus,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import {
  getSubscribers,
  getLoyaltyTransactions,
  adjustLoyaltyPoints,
  generateEventCheckInCode,
  getActiveCheckInCodes,
  deactivateCheckInCode,
  getEventsForCheckIn,
} from '@/app/subscriber-actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SubscriberRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  loyaltyPoints: number;
  status: string;
  source: string;
  signupDate: Date;
}

interface CheckInCodeRow {
  id: string;
  code: string;
  eventId: string;
  pointsAwarded: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  eventTitle: string | null;
  eventStartDate: Date | null;
}

interface TransactionRow {
  id: string;
  points: number;
  reason: string;
  eventId: string | null;
  adminId: string | null;
  createdAt: Date;
  eventTitle: string | null;
}

interface EventRow {
  id: string;
  title: string;
  startDate: Date;
  location: string;
}

type Tab = 'subscribers' | 'checkin';

export default function SubscribersDashboard() {
  const [tab, setTab] = useState<Tab>('subscribers');
  const [search, setSearch] = useState('');
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<SubscriberRow | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [pointsInput, setPointsInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [checkInCodes, setCheckInCodes] = useState<CheckInCodeRow[]>([]);
  const [availableEvents, setAvailableEvents] = useState<EventRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    const result = await getSubscribers({ search });
    if (result.success) {
      setSubscribers(result.subscribers as SubscriberRow[]);
    }
    setLoading(false);
  }, [search]);

  const loadCheckInCodes = useCallback(async () => {
    setLoading(true);
    const [codesResult, eventsResult] = await Promise.all([
      getActiveCheckInCodes(),
      getEventsForCheckIn(),
    ]);
    if (eventsResult.success) {
      setAvailableEvents(eventsResult.events as EventRow[]);
    }
    if (codesResult.success) {
      const codes = codesResult.codes as CheckInCodeRow[];
      setCheckInCodes(codes);
      // Generate QR codes
      const qrUrls: Record<string, string> = {};
      for (const code of codes) {
        const checkInUrl = `${window.location.origin}/check-in?code=${code.code}`;
        qrUrls[code.id] = await QRCode.toDataURL(checkInUrl, {
          width: 400,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
      }
      setQrDataUrls(qrUrls);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'subscribers') {
      loadSubscribers();
    } else {
      loadCheckInCodes();
    }
  }, [tab, loadSubscribers, loadCheckInCodes]);

  const handleViewTransactions = async (sub: SubscriberRow) => {
    setSelectedSub(sub);
    const result = await getLoyaltyTransactions(sub.id);
    if (result.success) {
      setTransactions(result.transactions as TransactionRow[]);
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedSub || !pointsInput || !reasonInput) return;
    const points = parseInt(pointsInput, 10);
    if (isNaN(points)) return;

    const result = await adjustLoyaltyPoints(
      selectedSub.id,
      points,
      reasonInput,
    );
    if (result.success) {
      toast.success('Points adjusted successfully');
      setPointsInput('');
      setReasonInput('');
      // Refresh subscriber data
      await loadSubscribers();
      // Refresh transactions
      const updatedSub = {
        ...selectedSub,
        loyaltyPoints: selectedSub.loyaltyPoints + points,
      };
      setSelectedSub(updatedSub);
      const txResult = await getLoyaltyTransactions(selectedSub.id);
      if (txResult.success) {
        setTransactions(txResult.transactions as TransactionRow[]);
      }
    } else {
      toast.error('Failed to adjust points');
    }
  };

  const handleGenerateCode = async () => {
    if (!selectedEventId) {
      toast.error('Please select an event');
      return;
    }
    const result = await generateEventCheckInCode(selectedEventId);
    if (result.success) {
      toast.success('Check-in QR code generated!');
      setSelectedEventId('');
      await loadCheckInCodes();
    } else {
      toast.error(result.error || 'Failed to generate code');
    }
  };

  const handleDeactivateCode = async (codeId: string) => {
    const result = await deactivateCheckInCode(codeId);
    if (result.success) {
      toast.success('Code deactivated');
      await loadCheckInCodes();
    } else {
      toast.error('Failed to deactivate code');
    }
  };

  const handleCopyCode = (code: string) => {
    const url = `${window.location.origin}/check-in?code=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadQR = (codeId: string, eventTitle: string | null) => {
    const dataUrl = qrDataUrls[codeId];
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `checkin-qr-${eventTitle || 'event'}.png`;
    link.click();
  };

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b border-white/5">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-semibold">
            The Nest — Loyalty Dashboard
          </h1>
          <a href="/admin">
            <Button variant="ghost" size="sm">
              ← Back to Calendar
            </Button>
          </a>
        </div>
      </header>

      <div className="container py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-white/5">
          <button
            onClick={() => setTab('subscribers')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'subscribers'
                ? 'border-primary text-foreground border-b-2'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Subscribers
          </button>
          <button
            onClick={() => setTab('checkin')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'checkin'
                ? 'border-primary text-foreground border-b-2'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <QrCode className="h-4 w-4" />
            Event Check-in Codes
          </button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : tab === 'subscribers' ? (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadSubscribers()}
              />
            </div>

            {/* Subscribers table */}
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                    <th className="px-4 py-3 text-right font-medium">Points</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Source</th>
                    <th className="px-4 py-3 text-left font-medium">Joined</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-muted-foreground px-4 py-12 text-center"
                      >
                        No subscribers found.
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((sub) => (
                      <tr
                        key={sub.id}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium">
                          {sub.firstName} {sub.lastName}
                        </td>
                        <td className="text-muted-foreground px-4 py-3">
                          {sub.email}
                        </td>
                        <td className="text-muted-foreground px-4 py-3">
                          {sub.phone || '—'}
                        </td>
                        <td className="text-primary px-4 py-3 text-right font-bold">
                          {sub.loyaltyPoints}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              sub.status === 'active'
                                ? 'bg-green-500/10 text-green-500'
                                : sub.status === 'unsubscribed'
                                  ? 'bg-red-500/10 text-red-500'
                                  : 'bg-yellow-500/10 text-yellow-500'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="text-muted-foreground px-4 py-3 text-xs">
                          {sub.source}
                        </td>
                        <td className="text-muted-foreground px-4 py-3 text-xs">
                          {new Date(sub.signupDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTransactions(sub)}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Generate new code */}
            <div className="glass-strong rounded-xl p-6">
              <h3 className="mb-4 text-lg font-semibold">
                Generate Event Check-in QR Code
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Select an upcoming event to generate a QR code. Attendees scan
                it at the door to check in and earn loyalty points.
              </p>
              <div className="flex gap-2">
                <Select
                  value={selectedEventId}
                  onValueChange={setSelectedEventId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select an event..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEvents.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No upcoming events found
                      </SelectItem>
                    ) : (
                      availableEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} —{' '}
                          {new Date(event.startDate).toLocaleDateString()} @{' '}
                          {event.location}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button onClick={handleGenerateCode}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate QR Code
                </Button>
              </div>
            </div>

            {/* Active check-in codes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Active Check-in Codes</h3>
              {checkInCodes.length === 0 ? (
                <div className="text-muted-foreground rounded-xl border border-white/5 p-12 text-center">
                  No active check-in codes. Generate one above.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {checkInCodes.map((code) => (
                    <div
                      key={code.id}
                      className="glass-strong rounded-xl p-6 text-center"
                    >
                      {qrDataUrls[code.id] && (
                        <div className="mb-4 inline-block rounded-lg bg-white p-4">
                          <img
                            src={qrDataUrls[code.id]}
                            alt="Check-in QR code"
                            className="h-48 w-48"
                          />
                        </div>
                      )}
                      <h4 className="mb-1 font-semibold">
                        {code.eventTitle || 'Unknown Event'}
                      </h4>
                      <p className="text-muted-foreground mb-2 text-sm">
                        {code.eventStartDate
                          ? new Date(code.eventStartDate).toLocaleDateString()
                          : ''}
                      </p>
                      <p className="text-primary mb-3 font-bold">
                        {code.pointsAwarded} points
                      </p>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(code.code)}
                        >
                          {copiedCode === code.code ? (
                            <>
                              <Check className="mr-1 h-3 w-3" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1 h-3 w-3" /> Copy Link
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownloadQR(code.id, code.eventTitle)
                          }
                        >
                          <Download className="mr-1 h-3 w-3" /> Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivateCode(code.id)}
                        >
                          Deactivate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction history drawer/modal */}
        {selectedSub && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedSub(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSelectedSub(null);
            }}
            role="button"
            tabIndex={0}
          >
            <div
              className="glass-strong max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="button"
              tabIndex={0}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {selectedSub.firstName} {selectedSub.lastName}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSub(null)}
                >
                  ✕
                </Button>
              </div>
              <p className="text-muted-foreground mb-1 text-sm">
                {selectedSub.email}
              </p>
              <p className="text-primary mb-4 text-2xl font-bold">
                {selectedSub.loyaltyPoints} points
              </p>

              {/* Adjust points */}
              <div className="mb-6 rounded-lg border border-white/5 bg-white/5 p-4">
                <h4 className="mb-3 text-sm font-medium">Adjust Points</h4>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Points (+/-)"
                    value={pointsInput}
                    onChange={(e) => setPointsInput(e.target.value)}
                    className="w-32"
                  />
                  <Input
                    placeholder="Reason"
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAdjustPoints} size="sm">
                    Apply
                  </Button>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  Use negative numbers to deduct points (e.g., -50 for
                  redemption).
                </p>
              </div>

              {/* Transaction history */}
              <h4 className="mb-3 text-sm font-medium">Transaction History</h4>
              <div className="space-y-2">
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No transactions yet.
                  </p>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {tx.reason.replace(/_/g, ' ')}
                        </p>
                        {tx.eventTitle && (
                          <p className="text-muted-foreground text-xs">
                            {tx.eventTitle}
                          </p>
                        )}
                        <p className="text-muted-foreground text-xs">
                          {new Date(tx.createdAt).toLocaleDateString()}{' '}
                          {new Date(tx.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <span
                        className={`font-bold ${tx.points > 0 ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {tx.points > 0 ? '+' : ''}
                        {tx.points}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
