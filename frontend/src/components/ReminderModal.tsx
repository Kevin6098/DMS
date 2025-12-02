import React, { useState, useEffect } from 'react';
import { reminderService, Reminder, ReminderCreateRequest } from '../services/reminderService';
import toast from 'react-hot-toast';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: number;
  fileName: string;
  existingReminder?: Reminder | null;
  onReminderCreated?: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  fileId,
  fileName,
  existingReminder,
  onReminderCreated
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  // Quick preset buttons
  const setQuickReminder = (preset: string) => {
    const now = new Date();
    let targetDate = new Date();
    let targetTime = '09:00';

    switch (preset) {
      case 'today-afternoon':
        targetTime = '14:00';
        break;
      case 'today-evening':
        targetTime = '18:00';
        break;
      case 'tomorrow-morning':
        targetDate.setDate(targetDate.getDate() + 1);
        targetTime = '09:00';
        break;
      case 'tomorrow-afternoon':
        targetDate.setDate(targetDate.getDate() + 1);
        targetTime = '14:00';
        break;
      case 'next-week':
        targetDate.setDate(targetDate.getDate() + 7);
        targetTime = '09:00';
        break;
      case 'next-month':
        targetDate.setMonth(targetDate.getMonth() + 1);
        targetTime = '09:00';
        break;
    }

    setReminderDate(targetDate.toISOString().split('T')[0]);
    setReminderTime(targetTime);
  };

  // Initialize form with existing reminder data
  useEffect(() => {
    if (existingReminder) {
      const datetime = new Date(existingReminder.reminder_datetime);
      setReminderDate(datetime.toISOString().split('T')[0]);
      setReminderTime(datetime.toTimeString().slice(0, 5));
      setTitle(existingReminder.title || '');
      setNote(existingReminder.note || '');
      setPriority(existingReminder.priority);
      setIsRecurring(existingReminder.is_recurring);
      if (existingReminder.recurrence_pattern) {
        setRecurrencePattern(existingReminder.recurrence_pattern);
      }
      if (existingReminder.recurrence_end_date) {
        setRecurrenceEndDate(existingReminder.recurrence_end_date.split('T')[0]);
      }
    } else {
      // Default to tomorrow morning
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setReminderDate(tomorrow.toISOString().split('T')[0]);
      setReminderTime('09:00');
      setTitle('');
      setNote('');
      setPriority('medium');
      setIsRecurring(false);
      setRecurrencePattern('weekly');
      setRecurrenceEndDate('');
    }
  }, [existingReminder, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reminderDate || !reminderTime) {
      toast.error('Please select date and time');
      return;
    }

    const reminderDatetime = `${reminderDate}T${reminderTime}:00`;
    const reminderDateObj = new Date(reminderDatetime);

    // Validate that reminder is in the future
    if (reminderDateObj <= new Date() && !existingReminder) {
      toast.error('Reminder must be set for a future date and time');
      return;
    }

    setIsSubmitting(true);

    try {
      if (existingReminder) {
        // Update existing reminder
        const response = await reminderService.updateReminder(existingReminder.id, {
          reminderDatetime,
          title: title || undefined,
          note: note || undefined,
          priority,
          isRecurring,
          recurrencePattern: isRecurring ? recurrencePattern : undefined,
          recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined
        });

        if (response.success) {
          toast.success('Reminder updated successfully!');
          onReminderCreated?.();
          onClose();
        } else {
          toast.error(response.message || 'Failed to update reminder');
        }
      } else {
        // Create new reminder
        const data: ReminderCreateRequest = {
          fileId,
          reminderDatetime,
          title: title || undefined,
          note: note || undefined,
          priority,
          isRecurring,
          recurrencePattern: isRecurring ? recurrencePattern : undefined,
          recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined
        };

        const response = await reminderService.createReminder(data);

        if (response.success) {
          toast.success('Reminder set successfully!');
          onReminderCreated?.();
          onClose();
        } else {
          toast.error(response.message || 'Failed to create reminder');
        }
      }
    } catch (error: any) {
      console.error('Reminder error:', error);
      toast.error(error?.response?.data?.message || 'Failed to save reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content reminder-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className="fas fa-bell"></i>
            {existingReminder ? 'Edit Reminder' : 'Set Reminder'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* File info */}
            <div className="reminder-file-info">
              <i className="fas fa-file"></i>
              <span>{fileName}</span>
            </div>

            {/* Quick presets */}
            <div className="form-group">
              <label>Quick Set</label>
              <div className="quick-preset-buttons">
                <button type="button" className="preset-btn" onClick={() => setQuickReminder('today-afternoon')}>
                  Today 2PM
                </button>
                <button type="button" className="preset-btn" onClick={() => setQuickReminder('today-evening')}>
                  Today 6PM
                </button>
                <button type="button" className="preset-btn" onClick={() => setQuickReminder('tomorrow-morning')}>
                  Tomorrow 9AM
                </button>
                <button type="button" className="preset-btn" onClick={() => setQuickReminder('tomorrow-afternoon')}>
                  Tomorrow 2PM
                </button>
                <button type="button" className="preset-btn" onClick={() => setQuickReminder('next-week')}>
                  Next Week
                </button>
                <button type="button" className="preset-btn" onClick={() => setQuickReminder('next-month')}>
                  Next Month
                </button>
              </div>
            </div>

            {/* Date and Time */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reminderDate">Date *</label>
                <input
                  type="date"
                  id="reminderDate"
                  value={reminderDate}
                  onChange={e => setReminderDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="reminderTime">Time *</label>
                <input
                  type="time"
                  id="reminderTime"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">Title (optional)</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Review document, Submit report..."
                maxLength={255}
              />
            </div>

            {/* Note */}
            <div className="form-group">
              <label htmlFor="note">Note (optional)</label>
              <textarea
                id="note"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>

            {/* Priority */}
            <div className="form-group">
              <label>Priority</label>
              <div className="priority-buttons">
                <button
                  type="button"
                  className={`priority-btn priority-low ${priority === 'low' ? 'active' : ''}`}
                  onClick={() => setPriority('low')}
                >
                  <i className="fas fa-flag"></i> Low
                </button>
                <button
                  type="button"
                  className={`priority-btn priority-medium ${priority === 'medium' ? 'active' : ''}`}
                  onClick={() => setPriority('medium')}
                >
                  <i className="fas fa-flag"></i> Medium
                </button>
                <button
                  type="button"
                  className={`priority-btn priority-high ${priority === 'high' ? 'active' : ''}`}
                  onClick={() => setPriority('high')}
                >
                  <i className="fas fa-flag"></i> High
                </button>
              </div>
            </div>

            {/* Recurring */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={e => setIsRecurring(e.target.checked)}
                />
                <span>Repeat this reminder</span>
              </label>
            </div>

            {isRecurring && (
              <div className="recurring-options">
                <div className="form-row">
                  <div className="form-group">
                    <label>Repeat</label>
                    <select
                      value={recurrencePattern}
                      onChange={e => setRecurrencePattern(e.target.value as any)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Until (optional)</label>
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={e => setRecurrenceEndDate(e.target.value)}
                      min={reminderDate}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-bell"></i> {existingReminder ? 'Update Reminder' : 'Set Reminder'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;

