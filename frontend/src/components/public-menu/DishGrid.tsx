import type { MenuItem } from '../../lib/api';
import { DishCard } from './DishCard';

type DishGridProps = {
  items: MenuItem[];
};

export function DishGrid({ items }: DishGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <DishCard key={item.id} item={item} />
      ))}
    </div>
  );
}
