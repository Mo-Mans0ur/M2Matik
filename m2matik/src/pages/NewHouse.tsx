import BackButton from "../components/BackButton";

export default function NewHouse() {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <BackButton />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Nybyggeri</h1>
      <p>Kommer snart.</p>
    </div>
  );
}
