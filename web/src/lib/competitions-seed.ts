import type { Competition } from "./types";

/**
 * Calendario de competiciones 2026, heredado de la app antigua (app.js).
 *
 * Es un respaldo: si la colección `competiciones` de Firestore tiene datos,
 * mandan esos. Sin esto, la pestaña de competiciones se quedaría en blanco
 * hasta que alguien las suba, que es justo la regresión que la app vieja
 * evitaba llevándolas en el código.
 */
export const COMPETITIONS_SEED: Competition[] = [
  { date: "2026-03-22", name: "Media Maratón de Madrid", dist: "5/21 km", lugar: "Madrid", cat: "running" },
  { date: "2026-03-28", name: "MetLife Madrid 15K", dist: "15 km", lugar: "Madrid", cat: "running" },
  { date: "2026-04-26", name: "Zurich Rock'n'Roll (MAPOMA)", dist: "10/21/42 km", lugar: "Madrid", cat: "running" },
  { date: "2026-05-10", name: "Carrera de la Mujer", dist: "6 km", lugar: "Madrid", cat: "running" },
  { date: "2026-06-14", name: "Maratón Guadarrama", dist: "44 km trail", lugar: "Cercedilla", cat: "running" },
  { date: "2026-10-04", name: "Carrera Popular Vicálvaro", dist: "5/10 km", lugar: "Vicálvaro", cat: "running" },

  { date: "2026-04-16", name: "HYROX Málaga", dist: "8 km + 8 WO", lugar: "FYCMA", cat: "hyrox", note: "16-19 abr" },
  { date: "2026-05-14", name: "HYROX Barcelona", dist: "8 km + 8 WO", lugar: "Fira Barcelona", cat: "hyrox", note: "14-17 may" },
  { date: "2026-05-22", name: "HYROX Madrid", dist: "8 km + 8 WO", lugar: "IFEMA", cat: "hyrox", note: "22-24 may" },

  { date: "2026-03-21", name: "DEKA MILE Guadarrama", dist: "MILE", lugar: "Box Siete Picos", cat: "deka" },
  { date: "2026-04-11", name: "DEKA MILE Arganda", dist: "MILE", lugar: "Heaven CrossFit", cat: "deka" },
  { date: "2026-04-18", name: "DEKA Valencia", dist: "FIT/MILE/Teams", lugar: "La Marina", cat: "deka" },
  { date: "2026-07-18", name: "DEKA Madrid", dist: "FIT/MILE/STRONG", lugar: "Madrid Arena", cat: "deka", note: "18-19 jul" },

  { date: "2026-05-29", name: "MAD Fitness Festival", dist: "Individual/Equipos", lugar: "Ciudad Real", cat: "crossfit", note: "Semifinal Games" },
  { date: "2026-05-09", name: "Tomelloso Throwdown", dist: "Parejas/Equipos", lugar: "Tomelloso", cat: "crossfit" },
  { date: "2026-05-22", name: "Batalla de Guisando", dist: "Ind./Parejas", lugar: "El Tiemblo", cat: "crossfit", note: "22-24 may" },
];
