import { Accessibility, Armchair } from "lucide-react";
import styles from "./seat-selection.module.css";

export default function SeatTypes() {
  return (
            <section className={styles.types} aria-labelledby="seat-types"><h2 id="seat-types">Tipos de assento</h2><div className={styles.typeList}>
              <div><Armchair size={32} aria-hidden="true" /><div><h3>Normal</h3><p>Poltrona padrão para aproveitar cada cena.</p></div></div>
              <div><Accessibility size={32} aria-hidden="true" /><div><h3>Acessível</h3><p>Espaço reservado para pessoas com deficiência ou mobilidade reduzida.</p></div></div>
            </div></section>
  );
}
