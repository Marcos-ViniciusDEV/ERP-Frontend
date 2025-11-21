/**
 * @module Utils
 * @description Utilitários gerais para o cliente React
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes CSS com suporte a classes condicionais do Tailwind
 *
 * Utiliza clsx para mesclar classes condicionalmente e twMerge para
 * resolver conflitos de classes Tailwind (ex: "p-4 p-2" → "p-2").
 *
 * @param inputs - Classes CSS, objetos condicionais ou arrays
 * @returns String de classes CSS mescladas e otimizadas
 *
 * @example
 * cn("px-4 py-2", "bg-blue-500") // "px-4 py-2 bg-blue-500"
 * cn("p-4", "p-2") // "p-2" (twMerge resolve conflito)
 * cn("text-red-500", isActive && "text-green-500") // Condicional
 * cn({ "font-bold": isImportant, "italic": isEmphasized })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
