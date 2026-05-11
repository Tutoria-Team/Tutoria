import React, { useState, useEffect } from 'react';

const HourlyAvailabilityGrid = ({ hourlyRate }) => {
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); 

  const hours = [9, 10, 11, 12, 13, 14, 15, 16]; 
  const intervals = ['00', '15', '30', '45'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // MOCK DATA: Pull from database in the future
  const isSlotAvailable = (day, hour) => {
    if (['Mon', 'Wed', 'Fri'].includes(day) && hour >= 12 && hour <= 16) return true;
    if (['Tue', 'Thu'].includes(day) && hour >= 9 && hour < 12) return true;
    return false;
  };

  const handleMouseDown = (slotId, available) => {
    if (!available) return; 
    setIsDragging(true);
    
    const isCurrentlySelected = selectedSlots.has(slotId);
    const newMode = isCurrentlySelected ? 'deselect' : 'select';
    setDragMode(newMode);
    
    updateSlot(slotId, newMode);
  };

  const handleMouseEnter = (slotId, available) => {
    if (!isDragging || !available) return;
    updateSlot(slotId, dragMode);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  const updateSlot = (slotId, mode) => {
    setSelectedSlots(prev => {
      const newSlots = new Set(prev);
      if (mode === 'select') newSlots.add(slotId);
      else newSlots.delete(slotId);
      return newSlots;
    });
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const totalHours = selectedSlots.size / 4;
  const estimatedTotal = (totalHours * hourlyRate).toFixed(2);

  return (
    <div className="hourly-grid-wrapper" onMouseLeave={handleMouseUp}>
      <div className="calendar-grid-header">
        <div className="time-label-spacer"></div>
        {days.map(day => <div key={day} className="day-header">{day}</div>)}
      </div>

      <div className="hourly-grid-body">
        {hours.map((hour) => (
          <div key={hour} className="hour-row">
            <div className="time-label">
              {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
            </div>
            <div className="days-container">
              {days.map((day) => {
                const available = isSlotAvailable(day, hour);
                return (
                  <div key={day} className={`day-column ${!available ? 'unavailable-col' : ''}`}>
                    {intervals.map((minute) => {
                      const slotId = `${day}-${hour}-${minute}`;
                      const isSelected = selectedSlots.has(slotId);
                      return (
                        <div 
                          key={slotId}
                          className={`sub-slot ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                          onMouseDown={() => handleMouseDown(slotId, available)}
                          onMouseEnter={() => handleMouseEnter(slotId, available)}
                        ></div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hourly-summary-action">
        <div className="summary-text">
           {selectedSlots.size > 0 ? (
             <><span>{totalHours} hours selected</span> <strong>Total: ${estimatedTotal}</strong></>
           ) : (
             <span className="text-muted">Select time slots on the grid to begin.</span>
           )}
        </div>
        <button 
          className="book-button request-btn" 
          disabled={selectedSlots.size === 0}
          onClick={() => alert(`Requesting ${totalHours} hours for $${estimatedTotal}!`)}
        >
          Send Request
        </button>
      </div>
    </div>
  );
};

export default HourlyAvailabilityGrid;