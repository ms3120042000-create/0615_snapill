import React, { useState, useEffect } from "react";
import { 
  Plus, Bell, Check, Trash2, Calendar, Clock, Sparkles, CheckSquare, ClipboardList, Info
} from "lucide-react";

interface MedicationSchedule {
  id: string;
  name: string;
  dosage: string;
  mealTiming: string; // e.g., "식후 30분"
  times: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    bedtime: boolean;
  };
  takenToday: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    bedtime: boolean;
  };
}

export default function MedicationReminders() {
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("1정");
  const [newTiming, setNewTiming] = useState("식사 직후");
  
  // Custom form times
  const [times, setTimes] = useState({
    morning: true,
    afternoon: false,
    evening: true,
    bedtime: false
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("snapill_reminders");
    if (saved) {
      setSchedules(JSON.parse(saved));
    } else {
      // Setup some default pill schedules as demo items, so active layout isn't blank
      const demoItems: MedicationSchedule[] = [
        {
          id: "demo-rem-1",
          name: "타이레놀정 500mg (해열진통)",
          dosage: "1정",
          mealTiming: "식사 상관없이 4시간 간격",
          times: { morning: true, afternoon: true, evening: true, bedtime: false },
          takenToday: { morning: true, afternoon: false, evening: false, bedtime: false }
        },
        {
          id: "demo-rem-2",
          name: "아모크라정 375mg (기관지염 항생제)",
          dosage: "1필정",
          mealTiming: "식사 바로 직후 30분 이내",
          times: { morning: true, afternoon: true, evening: true, bedtime: false },
          takenToday: { morning: true, afternoon: true, evening: false, bedtime: false }
        }
      ];
      setSchedules(demoItems);
      localStorage.setItem("snapill_reminders", JSON.stringify(demoItems));
    }
  }, []);

  // Save to localStorage when updated
  const saveSchedules = (updated: MedicationSchedule[]) => {
    setSchedules(updated);
    localStorage.setItem("snapill_reminders", JSON.stringify(updated));
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMed: MedicationSchedule = {
      id: `man-med-${Date.now()}`,
      name: newName,
      dosage: newDosage,
      mealTiming: newTiming,
      times: { ...times },
      takenToday: {
        morning: false,
        afternoon: false,
        evening: false,
        bedtime: false
      }
    };

    const updated = [...schedules, newMed];
    saveSchedules(updated);
    setNewName("");
    setNewDosage("1정");
    setNewTiming("식후 30분");
    // Reset times
    setTimes({ morning: true, afternoon: false, evening: true, bedtime: false });
  };

  const deleteMedication = (id: string) => {
    const filtered = schedules.filter(item => item.id !== id);
    saveSchedules(filtered);
  };

  const toggleTaken = (medId: string, timeKey: "morning" | "afternoon" | "evening" | "bedtime") => {
    const updated = schedules.map(item => {
      if (item.id === medId) {
        return {
          ...item,
          takenToday: {
            ...item.takenToday,
            [timeKey]: !item.takenToday[timeKey]
          }
        };
      }
      return item;
    });
    saveSchedules(updated);
  };

  const resetTodayDoseStatus = () => {
    const reset = schedules.map(item => ({
      ...item,
      takenToday: {
        morning: false,
        afternoon: false,
        evening: false,
        bedtime: false
      }
    }));
    saveSchedules(reset);
  };

  // Compute stats of adherence today
  let totalDoseCountNeeded = 0;
  let takenDoseCount = 0;

  schedules.forEach(item => {
    if (item.times.morning) {
      totalDoseCountNeeded++;
      if (item.takenToday.morning) takenDoseCount++;
    }
    if (item.times.afternoon) {
      totalDoseCountNeeded++;
      if (item.takenToday.afternoon) takenDoseCount++;
    }
    if (item.times.evening) {
      totalDoseCountNeeded++;
      if (item.takenToday.evening) takenDoseCount++;
    }
    if (item.times.bedtime) {
      totalDoseCountNeeded++;
      if (item.takenToday.bedtime) takenDoseCount++;
    }
  });

  const percentComplete = totalDoseCountNeeded > 0 ? Math.round((takenDoseCount / totalDoseCountNeeded) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-100 pb-5 items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-semibold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <ClipboardList className="w-5 h-5 md:w-6 md:h-6" />
            </span>
            내 모바일 복약 수첩
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            처방받은 알약 또는 매일 복용하는 비타민 등 영양제를 가상 수첩에 주기에 따라 체크하고 복약 진도를 기재할 수 있습니다.
          </p>
        </div>

        {schedules.length > 0 && (
          <button 
            onClick={resetTodayDoseStatus}
            className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
          >
            오늘 체크 전체 리셋
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Adherence progress & item grid */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Progress overview */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-1 z-10">
              <span className="text-[10px] uppercase font-semibold text-slate-400">TODAY COMPLETED</span>
              <h3 className="text-xl font-bold font-display text-slate-800 flex items-center gap-1">
                오늘의 복용 이행률: <span className="text-blue-600">{percentComplete}%</span>
              </h3>
              <p className="text-xs text-slate-400">
                총 {totalDoseCountNeeded}회분 복용 스케줄 중 {takenDoseCount}회분 체크 완료되었습니다.
              </p>
            </div>

            {/* Simulated Pie/Meter */}
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center relative shrink-0 z-10">
              <span className="text-xs font-black text-slate-700">{percentComplete}%</span>
              {/* Spinning visual overlay bounds */}
              <div 
                className="absolute inset-0 rounded-full border-4 border-blue-500/80 border-t-transparent animate-pulse" 
                style={{ clipPath: `polygon(50% 50%, -50% -50%, ${percentComplete * 3.6}deg)` }} 
              />
            </div>
          </div>

          {/* Schedulers list representation */}
          <div className="space-y-3">
            {schedules.length > 0 ? (
              schedules.map((item) => (
                <div key={item.id} className="p-4 bg-white border border-slate-200 hover:border-slate-300 transition-all rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
                      <h4 className="font-semibold text-slate-800 text-sm leading-none shrink-0">{item.name}</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-600">
                        🥛 1회 {item.dosage}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        식사 시점: {item.mealTiming}
                      </span>
                    </div>
                  </div>

                  {/* Period selection grids */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    {/* Morning */}
                    {item.times.morning && (
                      <button
                        onClick={() => toggleTaken(item.id, "morning")}
                        className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          item.takenToday.morning 
                            ? "bg-blue-600 text-white shadow-sm" 
                            : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {item.takenToday.morning && <Check className="w-3.5 h-3.5" />}
                        아침 복용
                      </button>
                    )}

                    {/* Afternoon */}
                    {item.times.afternoon && (
                      <button
                        onClick={() => toggleTaken(item.id, "afternoon")}
                        className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          item.takenToday.afternoon 
                            ? "bg-blue-600 text-white shadow-sm" 
                            : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {item.takenToday.afternoon && <Check className="w-3.5 h-3.5" />}
                        점심 복용
                      </button>
                    )}

                    {/* Evening */}
                    {item.times.evening && (
                      <button
                        onClick={() => toggleTaken(item.id, "evening")}
                        className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          item.takenToday.evening 
                            ? "bg-blue-600 text-white shadow-sm" 
                            : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {item.takenToday.evening && <Check className="w-3.5 h-3.5" />}
                        저녁 복용
                      </button>
                    )}

                    {/* Bedtime */}
                    {item.times.bedtime && (
                      <button
                        onClick={() => toggleTaken(item.id, "bedtime")}
                        className={`px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          item.takenToday.bedtime 
                            ? "bg-blue-600 text-white shadow-sm" 
                            : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {item.takenToday.bedtime && <Check className="w-3.5 h-3.5" />}
                        취침 전
                      </button>
                    )}

                    <div className="h-6 w-px bg-slate-250 mx-1 md:block hidden" />

                    <button
                      onClick={() => deleteMedication(item.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400">
                <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">등록된 복용 스케줄이 비어있습니다</p>
                <p className="text-xs text-slate-400 max-w-[320px] mx-auto mt-1">
                  오른쪽 '복약 알림 약물 추가' 패널을 통해 정기적으로 먹는 비타민이나 처방받으신 병원 알약을 등록해 일과를 체크해 관리해 보세요.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column Form: Add manual medication reminder */}
        <div className="lg:col-span-12 xl:col-span-4">
          <form onSubmit={handleAddMedication} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Plus className="w-4 h-4 text-blue-500" />
              복약 스케줄 등록 패널
            </h3>

            <div className="space-y-3 font-medium">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">복약물품명</label>
                <input 
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 츄어블 비타민C 1000g, 탁센"
                  className="w-full text-xs px-3 py-2 border border-slate-200 focus:border-blue-500 outline-none rounded-lg text-slate-800 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">투여분량</label>
                  <input 
                    type="text"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    placeholder="예: 1정, 10ml, 1스푼"
                    className="w-full text-xs px-3 py-2 border border-slate-200 focus:border-blue-500 outline-none rounded-lg text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">식사 시점 수칙</label>
                  <input 
                    type="text"
                    value={newTiming}
                    onChange={(e) => setNewTiming(e.target.value)}
                    placeholder="예: 아침 식후 30분, 공복"
                    className="w-full text-xs px-3 py-2 border border-slate-200 focus:border-blue-500 outline-none rounded-lg text-slate-800 font-semibold"
                  />
                </div>
              </div>

              {/* Time Checkers checkboxes */}
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1.5">하루 복용 시간대 다중선택</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-100 text-xs text-slate-700">
                    <input 
                      type="checkbox"
                      checked={times.morning}
                      onChange={(e) => setTimes({ ...times, morning: e.target.checked })}
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    <span>아침 복용</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-100 text-xs text-slate-700">
                    <input 
                      type="checkbox"
                      checked={times.afternoon}
                      onChange={(e) => setTimes({ ...times, afternoon: e.target.checked })}
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    <span>점심 복용</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-100 text-xs text-slate-700">
                    <input 
                      type="checkbox"
                      checked={times.evening}
                      onChange={(e) => setTimes({ ...times, evening: e.target.checked })}
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    <span>저녁 복용</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border border-slate-100 text-xs text-slate-700">
                    <input 
                      type="checkbox"
                      checked={times.bedtime}
                      onChange={(e) => setTimes({ ...times, bedtime: e.target.checked })}
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    <span>취침 전 복용</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              내 수첩 복약 스케줄 추가
            </button>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-400 leading-relaxed flex items-start gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>진료를 통해 처방전 스캔 완료 시 해당 개수가 여기에 연동해 자동 보관됩니다.</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
