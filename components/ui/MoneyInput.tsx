'use client';
import { ChangeEvent } from 'react';
export function formatMoneyInput(value: string|number|null|undefined){const digits=String(value??'').replace(/\D/g,'').replace(/^0+(?=\d)/,'');return digits?Number(digits).toLocaleString('id-ID'):''}
export function parseMoneyInput(value: string){return value.replace(/\D/g,'').replace(/^0+(?=\d)/,'')}
type Props={value:string;onChange:(raw:string)=>void;id?:string;name?:string;placeholder?:string;disabled?:boolean;className?:string};
export default function MoneyInput({value,onChange,id,name,placeholder='1.000.000',disabled,className}:Props){function handle(e:ChangeEvent<HTMLInputElement>){onChange(parseMoneyInput(e.target.value))}return <div className={'money-input '+(className||'')}><span>Rp</span><input id={id} name={name} type="text" inputMode="numeric" autoComplete="off" value={formatMoneyInput(value)} onChange={handle} placeholder={placeholder} disabled={disabled}/></div>}
