
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Fix timezone offset issue by treating the string as local date parts
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
  
  return new Intl.DateTimeFormat('pt-BR').format(adjustedDate);
};

export const calculateReturnDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const result = new Date(date);
  result.setDate(result.getDate() + 20);
  return result.toISOString().split('T')[0];
};

export const getMonthName = (monthKey: string): string => {
  // monthKey is YYYY-MM
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
};