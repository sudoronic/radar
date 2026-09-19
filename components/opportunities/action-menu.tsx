import { recordAction } from "@/app/engagement/actions";
export function ActionMenu({ id }: { id: string }) {
  return <form action={recordAction} className="action-menu"><input type="hidden" name="opportunity_id" value={id}/>{[["interested","Interested"],["applied","Applied"],["going","Going"],["not_interested","Not interested"],["hide","Hide"]].map(([action,label])=><button name="action" value={action} key={action}>{label}</button>)}</form>;
}
