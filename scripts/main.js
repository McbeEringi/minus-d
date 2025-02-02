import{BlockPermutation,world,system}from'@minecraft/server';

const
run=f=>new Promise(r=>system.run(_=>r(f()))),
//uuidgen=()=>Array.from('00000000-0000-4000-1000-000000000000',x=>([1,1][x]?y=>(+x?(y&3|8):y).toString(16):(_=>x))(Math.random()*16|0)).join(''),
a2o=([x,y,z])=>({x,y,z}),
o2a=({x,y,z})=>[x,y,z],

add=(a,b)=>a.map((x,i)=>x+b[i]),
sub=(a,b)=>a.map((x,i)=>x-b[i]),
div=(a,b)=>a.map((x,i)=>x/b[i]),
length=w=>w.reduce((a,x)=>a+x*x,0)**.5,
distance=(a,b)=>length(sub(a,b)),
dote=w=>w.reduce((a,x)=>a+x,0),


smin=(a,b,k)=>(k/=1-.5**.5,(x=>b-k*(1<x?x:x<-1?0:1+.5*(x-(2-x*x)**.5)))((b-a)/k)),

draw=async({
	size=[8,8,8],
	sdf=p=>length(p)-3,
	bf=p=>'minecraft:white_stained_glass'
}={},{
	chunk=[8,8,8],
	place=false,
	msg=false,
	infill=true,
	id=Math.floor(Math.random()*0xffffffff).toString(16).padStart(8,0),
	hc,hcl,spc,est
}={})=>(
	place&&(place={d:place.dimension,p:o2a(place.location)}),
	hc=chunk.map(x=>x*.5),hcl=length(chunk)*.5,
	spc=div(size,chunk).map(x=>Math.ceil(x)),
	
	await[1,2,0].reduce((a,i,l)=>(
		l=[...Array(spc[i])],
		[].concat(...a.map(x=>l.map(({s,o}=0,j,{length:l})=>(
			s=(s=>(s[i]=j==l-1?size[i]-chunk[i]*j:chunk[i],s))(x.s?.slice()??[]),
			o=(o=>(o[i]=j*chunk[i],o))(x.o?.slice()??[]),
			{s,o,d:sdf(add(o,hc))}
		))))
	),[0]).reduce((a,x,i)=>(
		x.d<=hcl&&(i=-hcl<=x.d?0:1,a[i]??=[],a[i].push(x)),
		a
	),[]).reduce(async(a,p,t,arr)=>[...await a,(
		t||(est=arr.flat().length),t='outline,infill'.split(',')[t],
		await p.reduce(async(a,p,i,{length:l})=>[...await a,await(async w=>(
			msg&&est%20||msg.sendMessage(`${id} ${est/20} sec (${t}: ${(i/l*100).toFixed(1)} %%)`),est--,
			await run(_=>[1,2,0].reduce((a,i,l,o)=>(
				l=[...Array(p.s[i])],o=p.o[i],
				[].concat(...a.map(x=>l.map((_,j)=>({
					l:(l=>(l[i]=j,l))(x.l?.slice()??[]),
					g:(g=>(g[i]=o+j,g))(x.g?.slice()??[])
				}))))
			),[0]).forEach(q=>(
				sdf(q.g)<=0&&(b=>(
					b=b?BlockPermutation.resolve(...(Array.isArray(b)?b:[b])):null,
					w.setBlockPermutation(a2o(q.l),b)
				))(bf(q.g))
			))),/*
			await run(_=>[...Array(p.s[1])].forEach((_,y)=>[...Array(p.s[2])].forEach((_,z)=>[...Array(p.s[0])].forEach((q,x)=>(
				q={l:[x,y,z],g:add(p.o,[x,y,z])},
				sdf(q.g)<=0&&(b=>(
					b=b?BlockPermutation.resolve(...(Array.isArray(b)?b:[b])):null,
					w.setBlockPermutation(a2o(q.l),b)
				))(bf(q.g));
			))))),*/

			place?(
				world.structureManager.place(w.id,place.d,a2o(add(place.p,p.o))),
				world.structureManager.delete(w.id)
			):{w,p}
		))(world.structureManager.createEmpty(`minus-d:${id}_${p.o.join('-')}`,a2o(p.s)))],[])
	)],[])
);



world.beforeEvents.chatSend.subscribe((
	e,p=e.sender,d=p.dimension,
	msg=e.message.match(/^\.(?<cmd>\S*)\s*(?<arg>.*)$/)?.groups,
	cmd={
		ping:x=>(
			p.sendMessage('pong')
		),
		sphere:r=>+r?run(async w=>(
			r=+r,
			w=p=>distance(p,(x=>[x,x,x])(r))-r,
			await draw({
				size:(x=>[x,x,x])(Math.floor(r*2)+1),
				sdf:w,
				bf:p=>`minecraft:${((a,x)=>(x*=a.length,Math.random()<x%1?a[x+1&15]:a[x&15]))(
					'white,light_gray,gray,black,red,yellow,lime,green,cyan,light_blue,blue,purple,magenta,brown,orange,pink'.split(','),
					Math.atan2(p[0]-r+p[1]-r,p[2]-r+p[1]-r)/Math.PI*.5+.5
				)}_${w(p)/r+1<.7?'concrete':'stained_glass'}`
			},{place:p,msg:p}),
			p.sendMessage(`[  §aOK§r  ] sphere: Created sphere(r=${r}).`)
		)):p.sendMessage(`[§cFAILED§r] sphere: "${r}" is NaN or falsy value.`),
		octa:r=>+r?run(async w=>(
			r=+r,
			w=p=>dote(sub(p,(x=>[x,x,x])(r)).map(x=>Math.abs(x)))-r,
			await draw({
				size:(x=>[x,x,x])(Math.floor(r*2)+1),
				sdf:w,
				bf:p=>(w(p)/r+1<.3)?'minecraft:sea_lantern':`minecraft:${Math.random()<.5?'light_blue':'cyan'}_stained_glass`
			},{place:p,msg:p}),
			p.sendMessage(`[  §aOK§r  ] octa: Created octa(r=${r}).`)
		)):p.sendMessage(`[§cFAILED§r] octa: "${r}" is NaN or falsy value.`),
		smin:k=>run(async()=>(
			await draw({
				size:[8,20,8],
				sdf:p=>smin(
					distance(p,[4, 4,4])-4,
					distance(p,[4,16,4])-4,
					+k
				),
			},{place:p,msg:p}),
			p.sendMessage(`[  §aOK§r  ] smin: Created smin(k=${k}).`)
		)),
		info:x=>p.sendMessage(JSON.stringify(d.getBlock(p.location).permutation.getAllStates())),
		s:x=>run({
			l:_=>p.sendMessage(JSON.stringify(world.structureManager.getWorldStructureIds())),
			c:_=>p.sendMessage(`Deleted ${world.structureManager.getWorldStructureIds().map(x=>world.structureManager.delete(x)).length} structure data.`),
		}[x.trim()]),
	}
)=>(console.log(JSON.stringify(msg)),msg)&&(
	e.cancel=true,
	cmd[msg.cmd]||(_=>p.sendMessage(`Unknown command "${msg.cmd}".\nKnown commands: ${Object.keys(cmd)}`))
)(msg.arg));