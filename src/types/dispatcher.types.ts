export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'failed';

export interface ProofOcrResult {
  detected_order_id?: string;
  detected_recipient?: string;
  signature_present: boolean;
  confidence_score: number;
  summary: string;
}

export interface DeliveryStop {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  notes?: string;
  status: DeliveryStatus;
  eta_minutes?: number;
  estimated_arrival?: string;
  proof_image_base64?: string;
  proof_ocr_result?: ProofOcrResult;
  delivered_at?: string;
  failed_reason?: string;
  whatsapp_last_notified?: string;
}

export interface RoutePlan {
  id: string;
  date: string;
  driver_name: string;
  vehicle_type: 'moto' | 'carro' | 'furgão' | 'bicicleta';
  stops: DeliveryStop[];
  status: 'draft' | 'in_progress' | 'completed';
  total_distance_km: number;
  started_at?: string;
  completed_at?: string;
}
