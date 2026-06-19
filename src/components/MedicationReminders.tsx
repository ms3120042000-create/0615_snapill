import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Check, Trash2, ClipboardList, X, Sun, Coffee, Moon, BedDouble,
} from "lucide-react";

interface MedicationSchedule {
  id: string;
  name: string;
  dosage: string;
  mealTiming: string;
  times: { morning: boolean; afternoon: boolean; evening: boolean; bedtime: boolean };
  takenToday: { morning: boolean; afternoon: boolean; evening: boolean; bedtime: boolean };
}

type TimeKey = "morning" | "afternoon" | "evening" | "bedtime";

const SLOTS: { key: TimeKey; label: string; icon: React.ElementType; headerBg: string; cardBg: string; borderColor: string; countColor: string }[] = [
  { key: "morning",   label: "아침", icon: Sun,       headerBg: "bg-orange-500", cardBg: "bg-orange-50",  borderColor: "border-orange-300", countColor: "text-orange-100" },
  { key: "afternoon", label: "점심", icon: Coffee,    headerBg: "bg-emerald-500",cardBg: "bg-emerald-50", borderColor: "border-emerald-300",countColor: "text-emerald-100" },
  { key: "evening",   label: "저녁", icon: Moon,      headerBg: "bg-indigo-500", cardBg: "bg-indigo-50",  borderColor: "border-indigo-300", countColor: "text-indigo-100" },
];

const DEMO_ITEMS: MedicationSchedule[] = [
  {
    id: "demo-rem-1",
    name: "타이레놀정 500mg",
    dosage: "1정",
    mealTiming: "식사 무관",
    times: { morning: true, afternoon: true, evening: true, bedtime: false },
    takenToday: { morning: true, afternoon: false, evening: false, bedtime: false },
  },
  {
    id: "demo-rem-2",
    name: "아모크라정 375mg",
    dosage: "1정",
    mealTiming: "식후 30분",
    times: { morning: true, afternoon: false, evening: true, bedtime: false },
    takenToday: { morning: false, afternoon: false, evening: false, bedtime: false },
  },
];

export default function MedicationReminders() {
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("1정");
  const [newTiming, setNewTiming] = useState("식사 직후");
  const [times, setTimes] = useState<MedicationSchedule["times"]>({
    morning: true, afternoon: false, evening: true, bedtime: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem("snapill_reminders");
    if (saved) {
      setSchedules(JSON.parse(saved));
    } else {
      setSchedules(DEMO_ITEMS);
      localStorage.setItem("snapill_reminders", JSON.stringify(DEMO_ITEMS));
    }
  }, []);

  const save = (updated: MedicationSchedule[]) => {
    setSchedules(updated);
    localStorage.setItem("snapill_reminders", JSON.stringify(updated));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    save([
      ...schedules,
      {
        id: `med-${Date.now()}`,
        name: newName.trim(),
        dosage: newDosage,
        mealTiming: newTiming,
        times: { ...times },
        takenToday: { morning: false, afternoon: false, evening: false, bedtime: false },
      },
    ]);
    setNewName("");
    setNewDosage("1정");
    setNewTiming("식사 직후");
    setTimes({ morning: true, afternoon: false, evening: true, bedtime: false });
    setShowModal(false);
  };

  const toggleTaken = (id: string, key: TimeKey) => {
    save(schedules.map(s =>
      s.id === id ? { ...s, takenToday: { ...s.takenToday, [key]: !s.takenToday[key] } } : s
    ));
  };

  const remove = (id: string) => save(schedules.filter(s => s.id !== id));

  const resetAll = () =>
    save(schedules.map(s => ({
      ...s,
      takenToday: { morning: false, afternoon: false, evening: false, bedtime: false },
    })));

  let total = 0, taken = 0;
  schedules.forEach(s => {
    (["morning", "afternoon", "evening", "bedtime"] as TimeKey[]).forEach(k => {
      if (s.times[k]) { total++; if (s.takenToday[k]) taken++; }
    });
  });
  const percent = total > 0 ? Math.round((taken / total) * 100) : 0;

  // "취침 전" 약만 따로 모음
  const bedtimeMeds = schedules.filter(s => s.times.bedtime);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex border-b border-slate-100 pb-5 items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-semibold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <ClipboardList className="w-5 h-5 md:w-6 md:h-6" />
            </span>
            내 복약 수첩
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            오늘 복용할 약을 시간대별로 확인하고 체크해보세요.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {schedules.length > 0 && (
            <button
              onClick={resetAll}
              className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-semibold rounded-lg cursor-pointer"
            >
              오늘 리셋
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            약 추가
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700">오늘의 복용 이행률</span>
          <span className="text-xs font-bold text-blue-600">{taken}/{total}회 완료 · {percent}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* 아침 / 점심 / 저녁 — 3-column slot cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SLOTS.map(slot => {
          const slotMeds = schedules.filter(s => s.times[slot.key]);
          const slotTaken = slotMeds.filter(s => s.takenToday[slot.key]).length;

          return (
            <div key={slot.key} className={`rounded-2xl border-2 ${slot.borderColor} overflow-hidden flex flex-col`}>
              {/* Slot header */}
              <div className={`${slot.headerBg} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <slot.icon className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-sm">{slot.label}</span>
                </div>
                <span className={`text-xs font-semibold ${slot.countColor}`}>
                  {slotTaken}/{slotMeds.length}종
                </span>
              </div>

              {/* Med list */}
              <div className={`${slot.cardBg} p-3 space-y-2 flex-1 min-h-[140px]`}>
                {slotMeds.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">등록된 약이 없어요</p>
                ) : (
                  slotMeds.map(med => {
                    const isTaken = med.takenToday[slot.key];
                    return (
                      <motion.div
                        key={med.id}
                        layout
                        className={`p-3 bg-white rounded-xl border transition-all duration-300 ${
                          isTaken ? "border-slate-100 opacity-40" : "border-slate-200 shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {/* Circle checkbox */}
                          <button
                            onClick={() => toggleTaken(med.id, slot.key)}
                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isTaken
                                ? "bg-blue-600 border-blue-600"
                                : "border-slate-300 hover:border-blue-400 bg-white"
                            }`}
                          >
                            {isTaken && <Check className="w-3 h-3 text-white" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold leading-snug transition-all ${
                              isTaken ? "line-through text-slate-400" : "text-slate-800"
                            }`}>
                              {med.name}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {med.dosage} · {med.mealTiming}
                            </p>
                          </div>

                          <button
                            onClick={() => remove(med.id)}
                            className="text-slate-200 hover:text-red-400 transition-colors cursor-pointer shrink-0 mt-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 취침 전 (있을 때만 표시) */}
      {bedtimeMeds.length > 0 && (
        <div className="rounded-2xl border-2 border-slate-200 overflow-hidden">
          <div className="bg-slate-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">취침 전</span>
            </div>
            <span className="text-xs font-semibold text-slate-300">
              {bedtimeMeds.filter(s => s.takenToday.bedtime).length}/{bedtimeMeds.length}종
            </span>
          </div>
          <div className="bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            {bedtimeMeds.map(med => {
              const isTaken = med.takenToday.bedtime;
              return (
                <motion.div
                  key={med.id}
                  layout
                  className={`p-3 bg-white rounded-xl border transition-all duration-300 ${
                    isTaken ? "border-slate-100 opacity-40" : "border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleTaken(med.id, "bedtime")}
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                        isTaken ? "bg-blue-600 border-blue-600" : "border-slate-300 hover:border-blue-400 bg-white"
                      }`}
                    >
                      {isTaken && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${isTaken ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {med.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{med.dosage} · {med.mealTiming}</p>
                    </div>
                    <button onClick={() => remove(med.id)} className="text-slate-200 hover:text-red-400 cursor-pointer shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 약 추가 모달 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 text-base">약 추가</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">약품명 *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="예: 타이레놀, 비타민C 1000mg"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 focus:border-blue-500 outline-none rounded-lg text-slate-800 font-semibold"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">1회 용량</label>
                    <input
                      type="text"
                      value={newDosage}
                      onChange={e => setNewDosage(e.target.value)}
                      placeholder="예: 1정, 10ml"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 focus:border-blue-500 outline-none rounded-lg text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">식사 시점</label>
                    <input
                      type="text"
                      value={newTiming}
                      onChange={e => setNewTiming(e.target.value)}
                      placeholder="예: 식후 30분"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 focus:border-blue-500 outline-none rounded-lg text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-2">복용 시간대</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: "morning",   label: "☀️ 아침" },
                      { key: "afternoon", label: "☕ 점심" },
                      { key: "evening",   label: "🌙 저녁" },
                      { key: "bedtime",   label: "🛌 취침 전" },
                    ] as { key: TimeKey; label: string }[]).map(t => (
                      <label
                        key={t.key}
                        className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border transition-all text-xs font-semibold select-none ${
                          times[t.key]
                            ? "bg-blue-50 border-blue-400 text-blue-700"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={times[t.key]}
                          onChange={e => setTimes(prev => ({ ...prev, [t.key]: e.target.checked }))}
                          className="hidden"
                        />
                        {times[t.key] && <Check className="w-3.5 h-3.5 shrink-0" />}
                        {t.label}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  추가하기
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
