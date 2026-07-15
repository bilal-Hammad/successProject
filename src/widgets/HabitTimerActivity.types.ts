// Content shown on the Live Activity. Crosses the JS<->native bridge as JSON,
// so dates are ISO strings here, not Date instances — the layout function
// reconstructs real Dates from these before handing them to native Text/timerInterval.
export type HabitTimerActivityProps = {
  habitName: string;
  habitIcon: string;
  habitColor: string;
  startDate: string; // ISO 8601 — lower bound of the countdown's timerInterval
  endDate: string;   // ISO 8601 — upper bound; shifts forward on resume by the paused duration
  pausedAt?: string; // ISO 8601 — present only while paused; freezes the displayed countdown
};

export type HabitTimerSessionInput = {
  habitName: string;
  habitIcon: string;
  habitColor: string;
  startDate: Date;
  endDate: Date;
};
