import { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { FormField, INPUT_CLASS } from '../components/FormField';
import { useToast } from '../components/ToastProvider';
import { DAY_STATUS_CLASSES } from '../utils/timeLogLayout';
import {
  useWorkdayTarget,
  useTrackingStartDate,
  setWorkdayTarget,
  setTrackingStartDate,
  DEFAULT_TARGET,
} from '../hooks/useWorkdaySettings';

export default function Settings() {
  const target = useWorkdayTarget();
  const trackingStart = useTrackingStartDate();
  const [targetDraft, setTargetDraft] = useState(String(target));
  const [trackingDraft, setTrackingDraft] = useState(trackingStart);
  const [errors, setErrors] = useState({});
  const showToast = useToast();

  // Resync drafts if the stored values change elsewhere (e.g. another tab).
  useEffect(() => { setTargetDraft(String(target)); }, [target]);
  useEffect(() => { setTrackingDraft(trackingStart); }, [trackingStart]);

  function handleSave(e) {
    e.preventDefault();
    const n = Number(targetDraft);
    const nextErrors = {};
    if (!Number.isFinite(n) || n <= 0 || n > 24) {
      nextErrors.target = 'Enter a number of hours between 0 and 24';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trackingDraft)) {
      nextErrors.tracking = 'Pick a valid date';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setWorkdayTarget(n);
    setTrackingStartDate(trackingDraft);
    showToast('Settings saved');
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <form onSubmit={handleSave} className="max-w-md">
        <FormField label="Workday target (hours)" error={errors.target}>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="24"
            className={INPUT_CLASS}
            value={targetDraft}
            onChange={(e) => setTargetDraft(e.target.value)}
          />
        </FormField>
        <p className="text-sm text-fg-muted -mt-2 mb-4">
          A day counts as complete once you log this many hours. Default is {DEFAULT_TARGET}.
        </p>

        <FormField label="Tracking start date" error={errors.tracking}>
          <input
            type="date"
            className={INPUT_CLASS}
            value={trackingDraft}
            onChange={(e) => setTrackingDraft(e.target.value)}
          />
        </FormField>
        <p className="text-sm text-fg-muted -mt-2 mb-4">
          Days before this are never marked as missed — set it to when you started
          tracking time so earlier dates stay neutral.
        </p>

        <Button type="submit">Save</Button>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-3">Calendar colours</h2>
        <ul className="space-y-2 text-sm">
          {[
            ['green', `Logged ${target}h or more — a complete day`],
            ['blue', 'Some time logged, but under the target'],
            ['red', 'A working day with nothing logged'],
            ['neutral', 'Weekend, a future date, or before tracking started'],
          ].map(([status, label]) => (
            <li key={status} className="flex items-center gap-3">
              <span
                className={`inline-block w-8 h-6 rounded ${DAY_STATUS_CLASSES[status]}`}
                aria-hidden="true"
              />
              <span className="text-fg">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
