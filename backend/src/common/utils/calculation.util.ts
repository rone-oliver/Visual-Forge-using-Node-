export interface Ratable {
    rating: number;
}

export function calculateAverageRating(items: Ratable[] | undefined): number {
    if (!items || items.length === 0) {
      return 0;
    }
  
    const sum = items.reduce((acc, curr) => acc + curr.rating, 0);
    const average = sum / items.length;
  
    return parseFloat(average.toFixed(1));
}