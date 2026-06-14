import { PrescriptionAnalysisResult, PillAnalysisResult } from "./types";

// Base64 or elegant static representations of mock images for immediate UI previewing
export const SAMPLE_PRESCRIPTION_IMAGE = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800";
export const SAMPLE_Tylenol_IMAGE = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800";

export const SAMPLE_PRESCRIPTION_DATA: PrescriptionAnalysisResult = {
  diseaseName: "급성 인두편도염 (Acute Nasopharyngitis & Tonsillitis)",
  prescriptionDate: "2026-06-14",
  institutionName: "한울가정의학과의원",
  drugs: [
    {
      id: "drug-1",
      name: "아모크라정 375mg (Amocra Tab.)",
      ingredients: "아목시실린수화물 250mg, 묽은클라불란산칼륨 125mg",
      strength: "375mg",
      oneDose: "1정",
      dailyFrequency: "3회",
      duration: "5일",
      category: "주로 그람양성, 음성균에 작용하는 것 (항생제)",
      efficacy: "기관지염, 편도염, 중이염 등 박테리아 감염증 치료",
      precaution: "설사가 발생할 수 있으므로 심할 경우 의사와 상담하세요. 투약 완료시까지 임의 중단을 금합니다."
    },
    {
      id: "drug-2",
      name: "뮤코펙트정 (Mucopect Tab.)",
      ingredients: "암브록솔염산염 30mg",
      strength: "30mg",
      oneDose: "1정",
      dailyFrequency: "3회",
      duration: "5일",
      category: "진해거담제 (호흡기관용약)",
      efficacy: "임상 급만성 호흡기질환에서의 점액분비장애 완화 및 가래 배출 촉진",
      precaution: "임산부 복용 전 의사 상담 필요. 복용 중 충분한 미온수를 섭취하면 거담 효과가 배가됩니다."
    },
    {
      id: "drug-3",
      name: "티로파정 (Tyropa Tab.)",
      ingredients: "티로프라미드염산염 100mg",
      strength: "100mg",
      oneDose: "1정",
      dailyFrequency: "3회",
      duration: "5일",
      category: "진경제 (의식하 소화기 진통약)",
      efficacy: "소화관, 담도, 요로 등의 급성 경련성 통증 제거",
      precaution: "구갈(입마름)이나 배뇨 장애가 올 수 있습니다. 심장 질환 환자는 신중히 투여하세요."
    }
  ],
  generalPrecautions: [
    "항생제가 포함되어 있으므로 증상이 완화되더라도 처방받은 5일치 약을 끝까지 진료 계획대로 복용하시는 것이 내성 방지에 매우 중요합니다.",
    "뮤코펙트의 점액 분비 활성화를 촉진하기 위해 복용 기간 동안 수분을 평소보다 하루에 2~3잔 더 의식적으로 섭취해 주세요.",
    "진경제 성분으로 복용 후 일시적인 입마름이나 가벼운 어지러움이 생길 수 있으니 운전 시 유의하시고 미온수로 구강을 자주 헹궈주세요.",
    "우유 및 고칼슘 음료는 항생제 흡수를 더디게 할 수 있으므로 물과 복용하시는 것이 최선입니다."
  ]
};

export const SAMPLE_PILL_DATA_1: PillAnalysisResult = {
  pillName: "타이레놀정 500mg (Tylenol Tab. 500mg)",
  manufacturer: "한국얀센 (Janssen Korea)",
  shape: "장방형 (Oval)",
  color: "하얀색 (White)",
  frontMarking: "TYLENOL",
  backMarking: "500",
  formulation: "필름코팅 성상 정제",
  mainIngredients: "아세트아미노펜 500mg (Acetaminophen 500mg)",
  efficacy: "감기로 인한 발열 및 통증, 두통, 신경통, 근육통, 생리통 완화",
  dosage: "성인 1회 1~2정씩, 1일 3~4회(4~6시간 간격) 복용. 하루 최대 4g(8정)을 초과할 수 없습니다.",
  warnings: [
    "음주 전후에 복용 시 간이 영구적으로 손상될 수 있으니 술을 드신 상태에서의 복용은 절대 피하셔야 합니다.",
    "종합감기약 등 아세트아미노펜 성분이 함유된 다른 약과 병용 복용 시 하루 최고 복용량을 넘지 않는지 반드시 확인하세요.",
    "위장장애가 적어 공복 시에도 복용 가능하나 통증 증상이 지속되거나 열이 내리지 않을 경우엔 바로 병원 진료를 받아야 합니다."
  ]
};

export const SAMPLE_PILL_DATA_2: PillAnalysisResult = {
  pillName: "탁센 연질캡슐 (Taxen Soft Cap.)",
  manufacturer: "GC녹십자",
  shape: "장방형 타원형 (Oval Soft Capsule)",
  color: "청록색 반투명 (Blue-Green Translucent)",
  frontMarking: "TX",
  backMarking: "없음",
  formulation: "연질캡슐제 (액상형)",
  mainIngredients: "나프록센 250mg (Naproxen 250mg)",
  efficacy: "편두통, 치통, 관절염, 요통, 월경 곤란증 등 급성 무균성 소염 및 진통 효과",
  dosage: "급성 통증 시 초회 2캡슐을 복용하고 이후 8~12시간마다 1캡슐씩 물과 함께 복용합니다. 공복 복용을 피하세요.",
  warnings: [
    "비스테로이드성 소염진통제(NSAIDs)로 위벽을 자극할 수 있어, 위장 장애 예방을 위해 반드시 식사 직후 충분한 물과 함께 섭취하세요.",
    "아스피린 또는 다른 소염진통제 알레르기가 있는 환자는 천식 발작을 유발할 수 있으므로 주의해야 합니다.",
    "심혈관계 위험 및 신장 기능 장애가 있는 고령자는 장기 연속 복용 시 사전에 지도의사와의 긴밀한 판단 하에 투여하십시오."
  ]
};
