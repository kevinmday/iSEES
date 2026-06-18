import { useCorpus } from "../context/CorpusContext";

export default function CorpusDiagnostics() {
  const { corpus } = useCorpus();

  return (
    <div>
      Corpus Events: {corpus.length}
    </div>
  );
}