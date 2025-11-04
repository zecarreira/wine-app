"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MandamentosPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-white/80 hover:text-white text-2xl"
          >
            ←
          </button>
          <Link href="/" className="text-white/80 hover:text-white text-2xl">
            🏠
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 max-w-4xl">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📜</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Mandamentos do Vinho
          </h1>
          <p className="text-purple-200">
            As regras sagradas dos nossos jantares
          </p>
        </div>

        {/* Main Rules */}
        <div className="bg-linear-to-br from-white/15 to-white/5 backdrop-blur-lg rounded-3xl p-6 md:p-8 mb-6 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-3">
            <span>⚖️</span>
            <span>Fundamentos</span>
          </h2>

          <div className="space-y-6 text-white">
            {/* Rule 1 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                1. Fundadores pela ordem de jantares:
              </h3>
              <ol className="list-decimal list-inside space-y-1.5 text-purple-100 ml-2">
                <li>José Carreira</li>
                <li>Ivo Duarte</li>
                <li>Ivo Rocha</li>
                <li>Miguel Violante</li>
                <li>Manuel Alves</li>
                <li>Ricardo Ambrósio</li>
                <li>João Diogo Carvalho</li>
              </ol>
            </div>

            {/* Rule 2 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                2. Presença Obrigatória
              </h3>
              <p className="text-purple-100 mb-2">
                Para a realização do jantar do vinho é obrigatório a presença de
                6 Fundadores.
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-purple-100 ml-2">
                <li>
                  Todos os fundadores, a excessão de quem organiza o jantar têm
                  de pagar{" "}
                  <span className="font-bold text-amber-300">10 pipas</span>{" "}
                  para acrescentar ao &quot;fundo do vinho&quot;.
                </li>
              </ul>
            </div>

            {/* Rule 3 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                3. Convidados Externos
              </h3>
              <p className="text-purple-100 mb-2">
                Cada organizador, só pode convidar 1 elemento externo;
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-purple-100 ml-2">
                <li>A excessão de família (pai, mãe, irmão, etc...);</li>
              </ul>
            </div>

            {/* Rule 4 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                4. Garrafas em Competição
              </h3>
              <p className="text-purple-100 mb-2">
                Quem Organiza têm direito a por 2 garrafas em competição, os
                restantes apenas 1;
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-purple-100 ml-2">
                <li>
                  O valor mínimo por cada garrafa terá de ser obrigatóriamente
                  de <span className="font-bold text-amber-300">10€</span>, a
                  excessão da 2ª garrafa do organizador que pode ter o valor que
                  ele decidir.
                </li>
                <li>
                  Não se pode levar garrafas que já estejam anteriormente
                  registadas.
                </li>
              </ul>
            </div>

            {/* Rule 5 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                5. Sistema de Pontuação
              </h3>
              <p className="text-purple-100">
                As pontuações são atribuidas de 0 a 10. No fim é somado todas as
                classificações e a que somar mais pontos é a nossa campeã.
              </p>
            </div>

            {/* Rule 6 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                6. Sequência Completa
              </h3>
              <p className="text-purple-100">
                Todos os fundadores têm de organizar o seu jantar para
                considerar-se a sequência completa. Não se pode avançar para a
                próxima sequência de jantares sem antes se completar a sequência
                anterior.
              </p>
            </div>

            {/* Rule 7 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                7. Passagem de Testemunho
              </h3>
              <p className="text-purple-100 mb-2">
                No fim de cada jantar, é efetuado a passagem de Testemunho
                (Caixa do Vinho) onde a pessoa que a recebe fica responsável por
                mimar, cuidar e preservar todo o conteúdo que se encontra dentro
                da Caixa.
              </p>
              <p className="text-purple-100">
                Na ausência do seguinte organizador fica o responsável atual de
                entregar o testemunho no espaço de{" "}
                <span className="font-bold text-amber-300">1 mês</span>.
              </p>
            </div>

            {/* Rule 8 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                8. Prazo para Organizar
              </h3>
              <p className="text-purple-100 mb-2">
                Aquando da passagem de testemunho fica a responsabilidade do
                novo organizador em marcar o novo jantar em um espaço de{" "}
                <span className="font-bold text-amber-300">6 meses</span>.
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-purple-100 ml-2">
                <li>
                  Para não haver penalização o organizador terá de expor
                  atempadamente a razão pela qual ainda não organizou o seu
                  jantar e terão todos os restantes fundadores que estar de
                  acordo se não, a penalização mantém-se.
                </li>
              </ul>
            </div>

            {/* Rule 9 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                9. Inovação Obrigatória
              </h3>
              <p className="text-purple-100">
                A cada passagem o novo organizador têm de acrescentar algo a
                caixa ou trazer algum tipo de inovação a Organização.
              </p>
            </div>

            {/* Rule 10 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                10. Babete Verde
              </h3>
              <p className="text-purple-100">
                O Babete verde será utilizado pelo organizador do jantar, e pelo
                seu convidado (se existir).
              </p>
            </div>

            {/* Rule 11 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                11. Destino das Pipas
              </h3>
              <p className="text-purple-100">
                Todas as pipas recolhidas pelas Penalizações serão para juntar
                ao fundo do vinho da Sequência em vigor.
              </p>
            </div>

            {/* Rule 12 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                12. Fundo do Vinho
              </h3>
              <p className="text-purple-100">
                O fundo do vinho terá como destino o evento extra no fim de cada
                sequência.
              </p>
            </div>

            {/* Rule 13 */}
            <div className="bg-white/5 rounded-2xl p-4 md:p-5">
              <h3 className="text-xl font-bold text-amber-300 mb-3">
                13. Alteração dos Fundamentos
              </h3>
              <p className="text-purple-100">
                Para a remoção, alteração ou adição de qualquer ponto nos
                Fundamentos do Vinho é necessário a aprovação de todos os
                Fundadores.
              </p>
            </div>
          </div>
        </div>

        {/* Penalties */}
        <div className="bg-linear-to-br from-red-500/20 to-orange-500/10 backdrop-blur-lg rounded-3xl p-6 md:p-8 border-2 border-red-400/30 shadow-2xl">
          <h2 className="text-2xl font-bold text-red-300 mb-6 flex items-center gap-3">
            <span>🚨</span>
            <span>Penalizações</span>
          </h2>

          <div className="space-y-4 text-white">
            {/* Penalty 1 */}
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-400/20">
              <h3 className="font-bold text-red-200 mb-2">
                1. Convidados Extra
              </h3>
              <p className="text-red-100 text-sm md:text-base">
                Quem quiser trazer algum convidado a mais do que está
                estipulado, terá de pagar{" "}
                <span className="font-bold text-red-300">20 pipas</span>. Limite
                de 1 pessoa max. Fica a cargo do organizador do evento a
                responsabilidade do pagamento dos seus convidados.
              </p>
            </div>

            {/* Penalty 2 */}
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-400/20">
              <h3 className="font-bold text-red-200 mb-2">
                2. Garrafa Repetida
              </h3>
              <p className="text-red-100 text-sm md:text-base">
                Se alguém, a exceção de um convidado, levar uma garrafa do mesmo
                ano que já tenha estado em competição terá uma penalização de{" "}
                <span className="font-bold text-red-300">10 pipas</span>.
              </p>
            </div>

            {/* Penalty 3 */}
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-400/20">
              <h3 className="font-bold text-red-200 mb-2">
                3. Atraso na Organização
              </h3>
              <p className="text-red-100 text-sm md:text-base">
                Se o jantar ultrapassar 6 meses para ser organizado, o
                responsável terá de pagar uma penalização de{" "}
                <span className="font-bold text-red-300">20 pipas</span>. A esta
                penalização é acrescido uma multa do mesmo valor por cada 6
                meses que demore a organizar o seu jantar.
              </p>
            </div>

            {/* Penalty 4 */}
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-400/20">
              <h3 className="font-bold text-red-200 mb-2">4. Sem Inovação</h3>
              <p className="text-red-100 text-sm md:text-base">
                Cada organizador que não trouxer nada de novo ou inovação para o
                seu jantar terá de pagar{" "}
                <span className="font-bold text-red-300">20 pipas</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-purple-200 text-sm italic">
            &quot;In Vino Veritas&quot; 🍷
          </p>
        </div>
      </main>
    </div>
  );
}
