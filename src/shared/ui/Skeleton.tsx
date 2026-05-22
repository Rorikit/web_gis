export const Skeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="skeleton">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} />
    ))}
  </div>
);
