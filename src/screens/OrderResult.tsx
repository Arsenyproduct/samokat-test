import { useEffect, useState } from 'react';
import { editCopy } from '../data/delivery';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui';
import { useRouter } from '../state/router';
import { useStore } from '../state/store';
import { useTrackingClock } from '../state/tracking';
import { Screen } from './Screen';
import s from './EditOrder.module.css';

/** 4.4 Отмена недоступна: the order stays, tracking resumes on «Вернуться к заказу». */
export function CancelBlocked() {
  const { backTo } = useRouter();
  const [supportAsked, setSupportAsked] = useState(false);
  useTrackingClock('pause');

  return (
    <Screen label={editCopy.blocked.title}>
      <div className={s.result}>
        <span className={s.resultIcon}>
          <Icon name="exclaim" size={96} stroke={3} />
        </span>
        <h1 className={s.resultTitle}>{editCopy.blocked.title}</h1>
        <p className={s.resultText}>{editCopy.blocked.text}</p>
        <Button onClick={() => setSupportAsked(true)}>{editCopy.blocked.support}</Button>
        <Button variant="muted" onClick={() => backTo(2, { name: 'tracking' })}>
          {editCopy.blocked.back}
        </Button>
        {supportAsked && <p className={s.resultNote}>{editCopy.blocked.supportNote}</p>}
      </div>
    </Screen>
  );
}

/** After a successful cancel (every store still waiting): the prototype starts over. */
export function Cancelled() {
  const { navigate } = useRouter();
  const { cancelOrder } = useStore();

  useEffect(() => {
    cancelOrder();
    // Cancel once, when the screen opens.
  }, []);

  return (
    <Screen label={editCopy.cancelled.title}>
      <div className={s.result}>
        <span className={s.resultIcon}>
          <Icon name="close" size={40} stroke={3} />
        </span>
        <h1 className={s.resultTitle}>{editCopy.cancelled.title}</h1>
        <p className={s.resultText}>{editCopy.cancelled.text}</p>
        <Button onClick={() => navigate({ name: 'home' })}>{editCopy.cancelled.home}</Button>
      </div>
    </Screen>
  );
}
