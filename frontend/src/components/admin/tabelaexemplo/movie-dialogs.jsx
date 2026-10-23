"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { genres, statuses } from "./data";
import styles from "./example-table.module.css";

export default function MovieDialogs({ table, returnFocus, fallbackFocus }) {
  const cancelButton = useRef(null);
  const titleInput = useRef(null);
  const removing = table.modal?.type === "remove";
  const editing = table.modal?.type === "edit";
  const movie = table.modal?.movie;

  return (
    <Dialog open={Boolean(table.modal)} onOpenChange={(open) => { if (!open) table.closeModal(); }}>
      <DialogContent
        className={styles.modal}
        showCloseButton={false}
        initialFocus={() => removing ? cancelButton.current : titleInput.current}
        finalFocus={() => returnFocus.current?.isConnected ? returnFocus.current : fallbackFocus.current}
      >
        <DialogClose className={styles.closeModal} aria-label="Fechar modal"><X size={20} aria-hidden="true" /></DialogClose>
        <DialogTitle className={styles.modalTitle}>{removing ? "Remover filme?" : editing ? "Editar filme" : "Novo filme"}</DialogTitle>
        <DialogDescription>
          {removing
            ? <>Deseja remover <strong>{movie?.title}</strong> da tabela? Para recuperar este registro nesta demonstração, será necessário cadastrá-lo novamente.</>
            : "Preencha os dados do filme. As alterações são apenas demonstrativas e não serão salvas ao recarregar a página."}
        </DialogDescription>
        {removing ? (
          <div className={styles.formActions}>
            <button ref={cancelButton} type="button" className={styles.secondary} onClick={table.closeModal}>Cancelar</button>
            <button type="button" className={styles.danger} onClick={table.removeMovie}>Confirmar remoção</button>
          </div>
        ) : table.modal && (
          <form key={movie?.id || "create"} onSubmit={table.saveMovie} className={styles.form}>
            <label className={styles.titleField}>Título do filme<input ref={titleInput} name="title" required maxLength={100} defaultValue={movie?.title || ""} placeholder="Ex.: Cinema Paradiso" /></label>
            <label>Gênero<select name="genre" defaultValue={movie?.genre || "Drama"}>{genres.map((genre) => <option key={genre}>{genre}</option>)}</select></label>
            <label>Duração em minutos<input name="duration" type="number" min="1" max="600" step="1" required defaultValue={movie?.duration || ""} placeholder="120" /></label>
            <label>Status<select name="status" defaultValue={movie?.status || "Em cartaz"}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            {table.error && <p className={styles.error} role="alert">{table.error}</p>}
            <div className={styles.formActions}>
              <button type="button" className={styles.secondary} onClick={table.closeModal}>Cancelar</button>
              <button className={styles.primary} type="submit">{editing ? "Salvar alterações" : "Adicionar filme"}</button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
