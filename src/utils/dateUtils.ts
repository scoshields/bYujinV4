export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  });
}

export function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

export function getWeekRange(date: Date) {
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Monday
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  return { startDate, endDate };
}

export function getCurrentWeekStart(): Date {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(today.setDate(diff));
}