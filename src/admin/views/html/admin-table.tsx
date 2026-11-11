import type { Children } from '@kitajs/html'

// The table the pickup admin panel used for its static game servers.
export function AdminTable(props: { head: string[]; children: Children; id?: string }) {
  return (
    <table class="w-full max-lg:min-w-2xl" id={props.id}>
      <thead>
        <tr>
          {props.head.map(title => (
            <th class="border-ash/50 border-b pr-2 pb-3 text-left" safe>
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{props.children}</tbody>
    </table>
  )
}

export function AdminCell(props: { children?: Children; bold?: boolean; class?: string }) {
  return (
    <td
      class={['border-ash/20 border-b py-4 pr-2 align-top', props.bold && 'font-bold', props.class]}
    >
      {props.children}
    </td>
  )
}
