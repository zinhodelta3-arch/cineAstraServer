import styles from './notifications.module.css';
import {ArrowRight,Bell,Check,MessageCircle,Ticket} from 'lucide-react';
import {dateFormatter,fullDateFormatter} from './notification-formatters';
export default function NotificationCard({item,onOpen,onToggle,pending}){
 const Icon=item.type==='support'?MessageCircle:item.type==='ticket'?Ticket:Bell;
 return <article className={`${styles.notification} ${!item.read?styles.unread:''}`} aria-label={item.title}>
  <div className={styles.iconStub}><Icon size={23} aria-hidden="true" /><span>{item.type==='ticket'?'COMPRA':item.type==='support'?'SUPORTE':'AVISO'}</span></div>
  <div className={styles.cardBody}>
   <div className={styles.cardMeta}><span>{item.label}</span>{item.createdAt&&<time dateTime={item.createdAt} title={fullDateFormatter.format(new Date(item.createdAt))}>{dateFormatter.format(new Date(item.createdAt))}</time>}{!item.read&&<span className={styles.newBadge}>Nova</span>}</div>
   <h3>{item.title}</h3><p className="break-words whitespace-pre-wrap">{item.description}</p>
   <div className={styles.cardActions}><button type="button" className={styles.detailsButton} onClick={()=>onOpen(item)}>Ver detalhes <ArrowRight size={15} aria-hidden="true" /></button>
    {!item.read&&<div className={styles.secondaryActions}><button type="button" disabled={pending} onClick={()=>onToggle(item)} aria-label={'Marcar '+item.subject+' como lida'}><Check size={15} aria-hidden="true" /><span>Marcar como lida</span></button></div>}
   </div>
  </div>
 </article>;
}
