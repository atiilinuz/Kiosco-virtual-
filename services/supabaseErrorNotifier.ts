import { Product } from '../types';

export interface SupabaseSyncErrorEvent {
  id: string;
  operation: 'save_product' | 'update_product' | 'delete_product' | 'bulk_products' | 'save_sale' | 'general';
  itemName: string;
  errorMessage: string;
  errorDetails?: string;
  timestamp: string;
  retryAction?: () => Promise<boolean>;
  cancelAction?: () => void;
  interruptAction?: () => void;
}

type ErrorListener = (errorEvent: SupabaseSyncErrorEvent | null) => void;

class SupabaseErrorNotifier {
  private currentError: SupabaseSyncErrorEvent | null = null;
  private listeners: ErrorListener[] = [];
  private isRetrying = false;

  subscribe(listener: ErrorListener) {
    this.listeners.push(listener);
    listener(this.currentError);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(event: SupabaseSyncErrorEvent | null) {
    this.currentError = event;
    this.listeners.forEach(l => {
      try {
        l(event);
      } catch (e) {
        console.error('Error notifying error listener:', e);
      }
    });
  }

  getCurrentError() {
    return this.currentError;
  }

  showError(event: Omit<SupabaseSyncErrorEvent, 'id' | 'timestamp'>) {
    const fullEvent: SupabaseSyncErrorEvent = {
      ...event,
      id: `err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.notify(fullEvent);
  }

  dismiss() {
    if (this.currentError?.cancelAction) {
      try {
        this.currentError.cancelAction();
      } catch (e) {
        console.error('Error in cancelAction on dismiss:', e);
      }
    }
    this.notify(null);
  }

  interrupt() {
    if (this.currentError?.interruptAction) {
      try {
        this.currentError.interruptAction();
      } catch (e) {
        console.error('Error in interruptAction on interrupt:', e);
      }
    }
    this.notify(null);
  }

  async retry(): Promise<boolean> {
    if (!this.currentError || !this.currentError.retryAction || this.isRetrying) {
      return false;
    }
    this.isRetrying = true;
    try {
      const success = await this.currentError.retryAction();
      if (success) {
        this.notify(null);
        return true;
      }
      return false;
    } catch (e: any) {
      const errMsg = e?.message || String(e) || 'TypeError: Failed to fetch';
      if (this.currentError) {
        this.currentError = {
          ...this.currentError,
          errorMessage: errMsg.includes('Failed to fetch') ? 'TypeError: Failed to fetch' : errMsg,
        };
        this.notify(this.currentError);
      }
      return false;
    } finally {
      this.isRetrying = false;
    }
  }
}

export const supabaseErrorNotifier = new SupabaseErrorNotifier();
