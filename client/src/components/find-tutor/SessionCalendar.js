import React, { useState } from 'react';

const SessionCalendar = ({ sessions, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const daysWithSessions = new Set(
    sessions.map((s) => new Date(s.session_timestamp).toDateString())
  );

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDateClick = (day) => {
    const clickedDate = new Date(year, month, day);
    const dateStr = clickedDate.toDateString();
    
    if (daysWithSessions.has(dateStr)) {
      setSelectedDateStr(dateStr);
      const availableTimes = sessions.filter(
        (s) => new Date(s.session_timestamp).toDateString() === dateStr
      );
      onSelectDate(availableTimes, clickedDate);
    }
  };

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => (
    <div key={`blank-${i}`} className="calendar-day empty"></div>
  ));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = new Date(year, month, day).toDateString();
    const hasSession = daysWithSessions.has(dateStr);
    const isSelected = selectedDateStr === dateStr;

    return (
      <div 
        key={day} 
        className={`calendar-day ${hasSession ? 'has-session' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => handleDateClick(day)}
      >
        {day}
      </div>
    );
  });

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="custom-calendar">
      <div className="calendar-header">
        <button onClick={handlePrevMonth}>&lt;</button>
        <strong>{monthNames[month]} {year}</strong>
        <button onClick={handleNextMonth}>&gt;</button>
      </div>
      <div className="calendar-grid">
        <div className="day-name">Su</div>
        <div className="day-name">Mo</div>
        <div className="day-name">Tu</div>
        <div className="day-name">We</div>
        <div className="day-name">Th</div>
        <div className="day-name">Fr</div>
        <div className="day-name">Sa</div>
        {blanks}
        {days}
      </div>
    </div>
  );
};

export default SessionCalendar;