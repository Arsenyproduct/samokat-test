import { stores } from '../data/catalog';
import { editCopy } from '../data/delivery';
import { Icon, type IconName } from '../components/Icon';
import { Button, StatusBar, StoreLogo } from '../components/ui';
import { useRouter, type Route } from '../state/router';
import { storeStates, useOrderTracking } from '../state/tracking';
import { Screen, screenStyles } from './Screen';
import s from './EditOrder.module.css';

export function BackButton() {
  const { back } = useRouter();
  return (
    <button type="button" className={s.back} aria-label="Назад" onClick={back}>
      <Icon name="chevL" size={36} stroke={2} />
    </button>
  );
}

const actions: { key: keyof typeof editCopy.actions; icon: IconName; to: Route; danger?: boolean }[] = [
  { key: 'add', icon: 'plus', to: { name: 'catalog' } },
  { key: 'remove', icon: 'minus', to: { name: 'edit-items' } },
  { key: 'amount', icon: 'sliders', to: { name: 'edit-items' } },
  { key: 'cancel', icon: 'close', to: { name: 'cancel' }, danger: true },
];

/** 4.1 Изменить заказ; with `cancelOpen` the 4.3 confirmation sheet is on top. */
export function EditOrder({ cancelOpen = false }: { cancelOpen?: boolean }) {
  const { navigate, back } = useRouter();
  const { rows, storesInCart, elapsed } = useOrderTracking('pause');
  const states = storeStates(rows, storesInCart, elapsed);

  const confirmCancel = () => {
    // Cancel works only while no store has started; otherwise frame 4.4.
    const possible = states.length > 0 && states.every((state) => state.canEdit);
    navigate({ name: possible ? 'cancelled' : 'cancel-blocked' }, { replace: true });
  };

  return (
    <Screen label={editCopy.title} animate={!cancelOpen}>
      <div className={screenStyles.scroll}>
        <div className={s.content}>
          <div className={s.header}>
            <h1 className={s.title}>{editCopy.title}</h1>
            <p className={s.subtitle}>{editCopy.subtitle}</p>
          </div>

          {actions.map((action) => {
            const copy = editCopy.actions[action.key];
            return (
              <button key={action.key} type="button" className={s.action} onClick={() => navigate(action.to)}>
                <span className={`${s.actionIcon} ${action.danger ? s.actionIconDanger : ''}`}>
                  <Icon name={action.icon} size={action.icon === 'sliders' ? 24 : 20} stroke={2} />
                </span>
                <span className={s.actionText}>
                  <span className={`${s.actionTitle} ${action.danger ? s.actionTitleDanger : ''}`}>{copy.title}</span>
                  <span className={s.actionNote}>{copy.note}</span>
                </span>
                <Icon name="chevThin" size={12} stroke={2} className={s.chev} />
              </button>
            );
          })}

          <div className={s.card}>
            <p className={s.cardTitle}>{editCopy.statusTitle}</p>
            {states.map((state) => (
              <div key={state.store} className={s.statusRow}>
                <StoreLogo store={state.store} size={13} />
                <span className={s.statusText}>
                  <span className={s.storeName}>{stores[state.store].name}</span>
                  <span className={s.storeStatus}>{state.status}</span>
                </span>
                <span className={`${s.chip} ${state.canEdit ? s.chipCan : s.chipCannot}`}>
                  {state.canEdit ? editCopy.can : editCopy.cannot}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StatusBar tone="dark" background="var(--bg-page)" />
      <BackButton />

      {cancelOpen && (
        <>
          <button type="button" className={s.dim} aria-label={editCopy.cancel.keep} onClick={back} />
          <div className={s.sheet} role="dialog" aria-label={editCopy.cancel.title}>
            <span className={s.sheetGrabber} aria-hidden="true" />
            <h2 className={s.sheetTitle}>{editCopy.cancel.title}</h2>
            <p className={s.sheetText}>{editCopy.cancel.text}</p>
            <div className={s.sheetStores}>
              {states.map((state) => (
                <StoreLogo key={state.store} store={state.store} size={17} />
              ))}
              <span>{editCopy.cancel.stores}</span>
            </div>
            <Button variant="dark" onClick={confirmCancel}>
              {editCopy.cancel.confirm}
            </Button>
            <Button variant="muted" onClick={back}>
              {editCopy.cancel.keep}
            </Button>
          </div>
        </>
      )}
    </Screen>
  );
}
