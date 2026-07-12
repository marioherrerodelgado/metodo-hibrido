/**
 * Motor de recomendación de zapatillas.
 *
 * El test antiguo devolvía casi siempre lo mismo porque encadenaba ifs sobre
 * una o dos respuestas. Aquí cada zapatilla tiene un perfil numérico y cada
 * respuesta mueve unos pesos: el resultado es un ranking continuo, no una
 * tabla de casos. Dos atletas con respuestas parecidas pero no idénticas
 * obtienen órdenes distintos, y siempre podemos explicar POR QUÉ.
 */

export type ShoeUse =
  | "asfalto-diario"
  | "asfalto-rapido"
  | "trail"
  | "cinta"
  | "crossfit"
  | "hyrox"
  | "gimnasio-fuerza";

export const USE_LABEL: Record<ShoeUse, string> = {
  "asfalto-diario": "Rodajes en asfalto",
  "asfalto-rapido": "Series y competición",
  trail: "Trail / montaña",
  cinta: "Cinta / interior",
  crossfit: "CrossFit (WOD)",
  hyrox: "Hyrox / DEKA",
  "gimnasio-fuerza": "Fuerza en gimnasio",
};

export interface ShoeAnswers {
  use: ShoeUse;
  /** km a la semana (running) o sesiones/semana (fuerza). */
  volume: 1 | 2 | 3; // 1 bajo, 2 medio, 3 alto
  /** Peso corporal en kg. */
  weight: number;
  /** Preferencia de amortiguación: 1 = seca y reactiva, 3 = blanda y protectora. */
  cushion: 1 | 2 | 3;
  /** Estabilidad: ¿le vence el tobillo hacia dentro? */
  pronation: "neutra" | "pronador";
  /** Le gusta notar el suelo (drop bajo) o prefiere talón alto. */
  drop: "bajo" | "medio" | "alto";
  /** Pie ancho. */
  wide: boolean;
  /** Presupuesto máximo en euros. */
  budget: number;
  /** Placa de carbono: solo si compite. */
  wantsPlate?: boolean;
}

export interface Shoe {
  id: string;
  name: string;
  brand: string;
  price: number;
  /** Usos para los que está construida (peso 1) y para los que sirve (0.5). */
  uses: Partial<Record<ShoeUse, number>>;
  /** 1 seca/reactiva … 3 blanda/máxima. */
  cushion: 1 | 2 | 3;
  /** Drop en mm. */
  dropMm: number;
  /** Soporte para pronación. */
  stability: "neutra" | "estabilidad";
  /** Horma ancha disponible / cómoda. */
  wideFriendly: boolean;
  /** Placa de carbono. */
  plate: boolean;
  /** Peso de la zapatilla en gramos (talla 42). */
  grams: number;
  /** Aguanta atleta pesado / mucho volumen. */
  durability: 1 | 2 | 3;
  /** Base estable para levantar (suela rígida y plana). */
  liftingBase: 1 | 2 | 3;
  note: string;
}

export const SHOES: Shoe[] = [
  // ── Running: rodaje diario
  {
    id: "novablast",
    name: "Novablast 5",
    brand: "ASICS",
    price: 150,
    uses: { "asfalto-diario": 1, "asfalto-rapido": 0.5, cinta: 0.8 },
    cushion: 3,
    dropMm: 8,
    stability: "neutra",
    wideFriendly: true,
    plate: false,
    grams: 245,
    durability: 3,
    liftingBase: 1,
    note: "Rodadora divertida: mucha espuma pero con rebote. Aguanta series suaves.",
  },
  {
    id: "pegasus",
    name: "Pegasus 41",
    brand: "Nike",
    price: 140,
    uses: { "asfalto-diario": 1, cinta: 1, "asfalto-rapido": 0.4 },
    cushion: 2,
    dropMm: 10,
    stability: "neutra",
    wideFriendly: false,
    plate: false,
    grams: 265,
    durability: 3,
    liftingBase: 1,
    note: "La zapatilla que nunca falla. Si dudas y solo quieres rodar, es esta.",
  },
  {
    id: "ghost",
    name: "Ghost Max 2",
    brand: "Brooks",
    price: 160,
    uses: { "asfalto-diario": 1, cinta: 0.8 },
    cushion: 3,
    dropMm: 6,
    stability: "neutra",
    wideFriendly: true,
    plate: false,
    grams: 290,
    durability: 3,
    liftingBase: 1,
    note: "Máxima protección y horma amplia. Perfecta para corredor pesado o rodajes largos.",
  },
  {
    id: "kayano",
    name: "Gel-Kayano 31",
    brand: "ASICS",
    price: 190,
    uses: { "asfalto-diario": 1, cinta: 0.7 },
    cushion: 3,
    dropMm: 10,
    stability: "estabilidad",
    wideFriendly: true,
    plate: false,
    grams: 295,
    durability: 3,
    liftingBase: 1,
    note: "Estabilidad sin sentirse un ladrillo. La referencia si pronas y sumas kilómetros.",
  },
  {
    id: "adrenaline",
    name: "Adrenaline GTS 24",
    brand: "Brooks",
    price: 145,
    uses: { "asfalto-diario": 1, cinta: 0.7 },
    cushion: 2,
    dropMm: 12,
    stability: "estabilidad",
    wideFriendly: true,
    plate: false,
    grams: 280,
    durability: 3,
    liftingBase: 1,
    note: "Control de pronación clásico, talón alto. Si vienes de zapatilla vieja, no te descoloca.",
  },

  // ── Running: rápido / competición
  {
    id: "vaporfly",
    name: "Vaporfly 3",
    brand: "Nike",
    price: 260,
    uses: { "asfalto-rapido": 1 },
    cushion: 2,
    dropMm: 8,
    stability: "neutra",
    wideFriendly: false,
    plate: true,
    grams: 195,
    durability: 1,
    liftingBase: 1,
    note: "Placa de carbono para el día de la carrera. No la uses para rodar: dura poco.",
  },
  {
    id: "adios-pro",
    name: "Adizero Adios Pro 4",
    brand: "adidas",
    price: 250,
    uses: { "asfalto-rapido": 1 },
    cushion: 2,
    dropMm: 6,
    stability: "neutra",
    wideFriendly: false,
    plate: true,
    grams: 205,
    durability: 1,
    liftingBase: 1,
    note: "Carbono agresivo para 10K y maratón. Exige buena técnica y gemelo fuerte.",
  },
  {
    id: "rebel",
    name: "Rebel v5",
    brand: "New Balance",
    price: 145,
    uses: { "asfalto-rapido": 1, "asfalto-diario": 0.6 },
    cushion: 2,
    dropMm: 6,
    stability: "neutra",
    wideFriendly: true,
    plate: false,
    grams: 210,
    durability: 2,
    liftingBase: 1,
    note: "Ligera y viva sin placa. La zapatilla de series si no quieres gastarte 250 €.",
  },

  // ── Trail
  {
    id: "speedgoat",
    name: "Speedgoat 6",
    brand: "HOKA",
    price: 155,
    uses: { trail: 1 },
    cushion: 3,
    dropMm: 5,
    stability: "neutra",
    wideFriendly: true,
    plate: false,
    grams: 280,
    durability: 3,
    liftingBase: 1,
    note: "Tacos agresivos y mucha espuma. Para trail largo y piedra suelta.",
  },
  {
    id: "sense-ride",
    name: "Sense Ride 5",
    brand: "Salomon",
    price: 140,
    uses: { trail: 1, "asfalto-diario": 0.4 },
    cushion: 2,
    dropMm: 8,
    stability: "neutra",
    wideFriendly: false,
    plate: false,
    grams: 275,
    durability: 3,
    liftingBase: 1,
    note: "Trail polivalente: agarra en mojado y no te castiga en pista.",
  },

  // ── CrossFit / Hyrox
  {
    id: "nano",
    name: "Nano X5",
    brand: "Reebok",
    price: 140,
    uses: { crossfit: 1, "gimnasio-fuerza": 0.8, hyrox: 0.5 },
    cushion: 1,
    dropMm: 7,
    stability: "neutra",
    wideFriendly: true,
    plate: false,
    grams: 280,
    durability: 3,
    liftingBase: 3,
    note: "Base estable para levantar y suficiente suela para 400 m de carrera dentro del WOD.",
  },
  {
    id: "metcon",
    name: "Metcon 10",
    brand: "Nike",
    price: 150,
    uses: { crossfit: 1, "gimnasio-fuerza": 1 },
    cushion: 1,
    dropMm: 8,
    stability: "neutra",
    wideFriendly: false,
    plate: false,
    grams: 300,
    durability: 3,
    liftingBase: 3,
    note: "Talón rígido: la mejor para levantar pesado. Corre lo justo con ella.",
  },
  {
    id: "tyr",
    name: "CXT-2 Trainer",
    brand: "TYR",
    price: 145,
    uses: { crossfit: 1, hyrox: 0.8, "gimnasio-fuerza": 0.9 },
    cushion: 2,
    dropMm: 9,
    stability: "neutra",
    wideFriendly: true,
    plate: false,
    grams: 290,
    durability: 3,
    liftingBase: 3,
    note: "Horma ancha y muy estable. La favorita si tu pie sufre en las de siempre.",
  },
  {
    id: "hyrox-shoe",
    name: "Cloudpulse / Hyrox",
    brand: "On",
    price: 170,
    uses: { hyrox: 1, crossfit: 0.6, "asfalto-diario": 0.4 },
    cushion: 2,
    dropMm: 8,
    stability: "neutra",
    wideFriendly: false,
    plate: false,
    grams: 275,
    durability: 2,
    liftingBase: 2,
    note: "El compromiso real de Hyrox: corre de verdad y aguanta el sled sin doblarse.",
  },
  {
    id: "endorphin-speed",
    name: "Endorphin Speed 4",
    brand: "Saucony",
    price: 170,
    uses: { hyrox: 1, "asfalto-rapido": 0.9, "asfalto-diario": 0.6 },
    cushion: 2,
    dropMm: 8,
    stability: "neutra",
    wideFriendly: false,
    plate: false,
    grams: 225,
    durability: 2,
    liftingBase: 1,
    note: "Si en Hyrox tu límite es el running y no las estaciones, esta te da los 8 km.",
  },

  // ── Fuerza
  {
    id: "romaleos",
    name: "Romaleos 4",
    brand: "Nike",
    price: 200,
    uses: { "gimnasio-fuerza": 1 },
    cushion: 1,
    dropMm: 20,
    stability: "neutra",
    wideFriendly: true,
    plate: false,
    grams: 500,
    durability: 3,
    liftingBase: 3,
    note: "Halterofilia pura: tacón rígido para sentadilla profunda y snatch. No sirve para nada más.",
  },
  {
    id: "adipower",
    name: "Adipower 3",
    brand: "adidas",
    price: 200,
    uses: { "gimnasio-fuerza": 1 },
    cushion: 1,
    dropMm: 22,
    stability: "neutra",
    wideFriendly: false,
    plate: false,
    grams: 480,
    durability: 3,
    liftingBase: 3,
    note: "Tacón alto y ligera para lo que es. Si haces halterofilia en serio, es esta.",
  },
];

export interface ShoeScore {
  shoe: Shoe;
  score: number;
  /** Porcentaje 0-100 para la UI. */
  match: number;
  reasons: string[];
  warnings: string[];
}

/**
 * Puntúa cada zapatilla contra las respuestas. Todas las dimensiones suman;
 * ninguna descarta por sí sola salvo el presupuesto (que sí es un límite duro).
 */
export function recommendShoes(a: ShoeAnswers): ShoeScore[] {
  const scored = SHOES.map((shoe): ShoeScore => {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    // 1. Uso principal — el factor con más peso (0-40).
    const useFit = shoe.uses[a.use] ?? 0;
    score += useFit * 40;
    if (useFit >= 1) reasons.push(`Diseñada para ${USE_LABEL[a.use].toLowerCase()}`);
    else if (useFit >= 0.5) reasons.push(`Cumple en ${USE_LABEL[a.use].toLowerCase()}`);
    else warnings.push("No es su terreno natural");

    // 2. Amortiguación deseada (0-16). Penaliza la distancia, no el valor absoluto.
    const cushionGap = Math.abs(shoe.cushion - a.cushion);
    score += (2 - cushionGap) * 8;
    if (cushionGap === 0) {
      reasons.push(
        a.cushion === 3
          ? "Amortiguación máxima, como pediste"
          : a.cushion === 1
            ? "Pisada seca y reactiva"
            : "Amortiguación equilibrada",
      );
    } else if (cushionGap === 2) {
      warnings.push(
        shoe.cushion > a.cushion
          ? "Más blanda de lo que buscas"
          : "Más dura de lo que buscas",
      );
    }

    // 3. Pronación (0-18). Si prona, la estabilidad importa mucho.
    if (a.pronation === "pronador") {
      if (shoe.stability === "estabilidad") {
        score += 18;
        reasons.push("Control de pronación");
      } else if (shoe.cushion === 3 && shoe.uses["asfalto-diario"]) {
        score += 6;
        warnings.push("Neutra: te vale si pronas poco, no si pronas mucho");
      } else if (a.use.startsWith("asfalto") || a.use === "trail") {
        warnings.push("Sin soporte para pronación");
      }
    } else if (shoe.stability === "estabilidad") {
      // Al neutro le sobra el soporte: molesta un poco, no lo invalida.
      score -= 4;
      warnings.push("Lleva soporte que no necesitas");
    }

    // 4. Drop (0-10).
    const wanted = a.drop === "bajo" ? 5 : a.drop === "medio" ? 8 : 11;
    // Las de halterofilia tienen drop enorme a propósito: no las penalizamos por ello.
    if (!(a.use === "gimnasio-fuerza" && shoe.dropMm >= 15)) {
      const dropGap = Math.abs(shoe.dropMm - wanted);
      score += Math.max(0, 10 - dropGap * 2);
      if (dropGap <= 2) reasons.push(`Drop de ${shoe.dropMm} mm, el que buscas`);
    } else {
      score += 10;
      reasons.push(`Tacón de ${shoe.dropMm} mm para sentadilla profunda`);
    }

    // 5. Volumen y peso corporal (0-14). Un atleta pesado o con mucho volumen
    //    necesita zapatilla que aguante; una de carbono se destroza.
    const demand = (a.volume === 3 ? 2 : a.volume === 2 ? 1 : 0) + (a.weight >= 85 ? 1 : 0);
    if (demand >= 2) {
      score += (shoe.durability - 1) * 7;
      if (shoe.durability === 3) reasons.push("Aguanta volumen y peso sin hundirse");
      if (shoe.durability === 1)
        warnings.push("Poco duradera para el volumen que haces");
    } else {
      score += 7;
    }
    if (a.weight >= 90 && shoe.cushion === 1 && a.use.startsWith("asfalto")) {
      score -= 8;
      warnings.push("Demasiado seca para tu peso corriendo en asfalto");
    }

    // 6. Base para levantar (0-12), solo cuando hay barra de por medio.
    if (a.use === "gimnasio-fuerza" || a.use === "crossfit") {
      score += (shoe.liftingBase - 1) * 6;
      if (shoe.liftingBase === 3) reasons.push("Base firme: no se hunde bajo la barra");
      if (shoe.liftingBase === 1) warnings.push("Se hunde al levantar pesado");
    }

    // 7. Horma ancha (0-10).
    if (a.wide) {
      if (shoe.wideFriendly) {
        score += 10;
        reasons.push("Horma amplia");
      } else {
        score -= 6;
        warnings.push("Horma estrecha: te apretará");
      }
    }

    // 8. Placa de carbono (0-12).
    if (a.wantsPlate && shoe.plate) {
      score += 12;
      reasons.push("Placa de carbono para el día de la carrera");
    } else if (shoe.plate && !a.wantsPlate) {
      score -= 14;
      warnings.push("Placa de carbono: cara y frágil si no compites");
    }

    // 9. Presupuesto — límite duro con margen del 10 %.
    if (shoe.price > a.budget * 1.1) {
      score -= 40;
      warnings.push(`Se va de presupuesto (${shoe.price} €)`);
    } else if (shoe.price <= a.budget * 0.8) {
      score += 5;
      reasons.push(`Entra holgada en presupuesto (${shoe.price} €)`);
    }

    return { shoe, score, match: 0, reasons: reasons.slice(0, 4), warnings: warnings.slice(0, 2) };
  });

  scored.sort((x, y) => y.score - x.score);

  // Normalizamos a % sobre el máximo teórico alcanzable, acotado a [40, 99]
  // para que la UI no muestre un 12 % desmoralizante ni un 100 % falso.
  const top = scored[0]?.score ?? 1;
  return scored.map((s) => ({
    ...s,
    match: Math.max(35, Math.min(99, Math.round((s.score / Math.max(top, 1)) * 96))),
  }));
}
