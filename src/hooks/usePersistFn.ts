/**
 * @module usePersistFn
 * @description Hook para criar funções persistentes sem dependências (alternativa ao useCallback)
 *
 * Reduz a carga cognitiva de gerenciar dependências do useCallback.
 * A função retornada mantém a mesma referência entre renders, mas sempre executa
 * a versão mais recente da função fornecida.
 *
 * @example
 * function Component({ data }) {
 *   const handleClick = usePersistFn(() => {
 *     console.log(data); // Sempre acessa o valor atual de data
 *   });
 *
 *   // handleClick tem referência estável, não causa re-renders desnecessários
 *   return <ChildComponent onClick={handleClick} />;
 * }
 */

import { useRef } from "react";

type noop = (...args: any[]) => any;

/**
 * Cria uma função com referência estável que sempre executa a versão mais recente
 *
 * @param fn - Função a ser persistida
 * @returns Função com referência estável entre renders
 *
 * @remarks
 * Alternativa ao useCallback sem necessidade de especificar dependências.
 * Útil para callbacks passados a componentes filhos pesados.
 */
export function usePersistFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useRef<T>(null);
  if (!persistFn.current) {
    persistFn.current = function (this: unknown, ...args) {
      return fnRef.current!.apply(this, args);
    } as T;
  }

  return persistFn.current!;
}
