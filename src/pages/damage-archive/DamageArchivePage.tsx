import { useDamages } from '@/features/damages/hooks/useDamages';
import { DamagesTable } from '@/features/damages/ui/DamagesTable';
import { useDistrictFilter } from '@/features/permissions/hooks/useDistrictFilter';
import { PageHeader } from '@/shared/ui';

export const DamageArchivePage = () => {
  const query = useDamages(true);
  const data = useDistrictFilter(query.data);
  return (
    <>
      <PageHeader title="Архив повреждений" />
      <DamagesTable data={data} isLoading={query.isLoading} isError={query.isError} />
    </>
  );
};
