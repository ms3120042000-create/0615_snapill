export interface PrescribedDrug {
  id: string;
  name: string;          // 약품명 (e.g., 아빌리파이정 5mg)
  ingredients: string;   // 성분명 및 함량 (e.g., 아리피프라졸 5mg)
  strength: string;      // 함량 (e.g., 5mg)
  oneDose: string;       // 1회 투약량 (e.g., 1정)
  dailyFrequency: string; // 1일 투약횟수 (e.g., 3회)
  duration: string;      // 투약일수 (e.g., 7일)
  category: string;      // 구분/효능 (e.g., 정신신경용제)
  efficacy: string;      // 효능/효과 (e.g., 조현병 치료)
  precaution: string;    // 주의사항 (e.g., 졸음 유발 주의, 금주)
}

export interface PrescriptionAnalysisResult {
  diseaseName?: string;     // 병명 또는 질병 분류 (e.g., 급성 인두염)
  prescriptionDate?: string; // 처방 날짜 (e.g., 2026-06-14)
  institutionName?: string; // 의료기관명 (e.g., 서울이비인후과의원)
  drugs: PrescribedDrug[];   // 처방된 의약품 목록
  generalPrecautions: string[]; // 종합 복약 지도 및 주의해야 할 음식/조합
}

export interface PillAnalysisResult {
  pillName: string;         // 알약명 (e.g., 타이레놀정 500mg)
  manufacturer: string;     // 제조사 (e.g., 한국얀센)
  shape: string;            // 성상/모양 (e.g., 장방형)
  color: string;            // 색상 (e.g., 하얀색)
  frontMarking: string;     // 앞면 식별표시 (e.g., TYLENOL)
  backMarking: string;      // 뒷면 식별표시 (e.g., 500)
  formulation: string;      // 제형 (e.g., 나정, 정제)
  mainIngredients: string;  // 주성분 및 함량 (e.g., 아세트아미노펜 500mg)
  efficacy: string;         // 효능/효과 (e.g., 해열 및 소염진통)
  dosage: string;           // 용법/용량 (e.g., 1회 1-2정, 일 최대 4g)
  warnings: string[];       // 신중 투여 및 부작용 경고 (e.g., 음주 후 복용 시 간 손상 위험)
}

export interface MedicationHistoryItem {
  id: string;
  timestamp: string;
  type: 'prescription' | 'pill';
  title: string; // e.g., "서울이비인후과 처방전" or "타이레놀정 500mg"
  prescriptionData?: PrescriptionAnalysisResult;
  pillData?: PillAnalysisResult;
}

export interface MedicationSchedule {
  id: string;
  drugName: string;
  timeOfDay: ('morning' | 'afternoon' | 'evening' | 'bedtime')[];
  instruction: string; // e.g., "식후 30분"
  isEnabled: boolean;
}
