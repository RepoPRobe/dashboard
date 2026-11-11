export default function BrandName({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={inverse ? "text-white" : "text-[#111827]"}>
      Repo<span className={inverse ? "text-white" : "text-[#5145FF]"}>PR</span>obe
    </span>
  );
}
