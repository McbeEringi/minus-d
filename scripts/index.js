import{BlockPermutation,world,system}from'@minecraft/server';

const
run=f=>new Promise(r=>system.run(_=>r(f()))),
//uuidgen=()=>Array.from('00000000-0000-4000-1000-000000000000',x=>([1,1][x]?y=>(+x?(y&3|8):y).toString(16):(_=>x))(Math.random()*16|0)).join(''),
assign=(w,f)=>w.reduce((a,x)=>(Object.entries(x).forEach(([i,x])=>i in a?(a[i]=f(a[i],x)):(a[i]=x)),a),{}),
add=(...w)=>assign(w,(a,x)=>a+x),sub=(...w)=>assign(w,(a,x)=>a-x),
mul=(...w)=>assign(w,(a,x)=>a*x),
map=(w,f)=>Object.entries(w).reduce((a,[i,x])=>(a[i]=f(x),a),{}),

length=w=>(w.x*w.x+w.y*w.y+w.z*w.z)**.5,
distance=(a,b)=>length(sub(a,b)),
dot=(a,b)=>Object.values(mul(a,b)).reduce((a,x)=>a+x),
smin=(a,b,k)=>(k/=1-.5**.5,(x=>b-k*(1<x?x:x<-1?0:1+.5*(x-(2-x*x)**.5)))((b-a)/k)),

draw=async({
	size={x:8,y:8,z:8},
	sdf=p=>length(p)-3,
	bf=p=>'minecraft:white_stained_glass'
}={},{
	chunk={x:8,y:8,z:8},
	place=false,
	msg=false,
	infill=true,
	id=`minus-d:${Math.floor(Math.random()*0xffffffff).toString(16).padStart(8,0)}`,
	hc,hcl
}={})=>(
	place&&(place={d:place.dimension,p:place.location}),
	hc=map(chunk,x=>x*.5),hcl=dot(hc,hc)**.5,
	
	await[...Array(Math.ceil(size.y/chunk.y))].reduce(async(a,y,j,{length:l},o={})=>(
		y=(j==l-1?size.y-(o.y=j*chunk.y):chunk.y),
		a=await a,
		msg&&msg.sendMessage(j?`${id} ${j}/${l} done...`:`${id} render started...`),
		a.concat(await[...Array(Math.ceil(size.z/chunk.z))].reduce(async(a,z,k,{length:l})=>(
			z=(k==l-1?size.z-(o.z=k*chunk.z):chunk.z),
			(await a).concat(await[...Array(Math.ceil(size.x/chunk.x))].reduce(async(a,s,i,{length:l})=>(
				s={x:(i==l-1?size.x-(o.x=(i*chunk.x):chunk.x),y,z},
				sdf(add(o,hc))<=hcl&&(infill||-hcl<=sdf(add(o,hc)))&&(await a).push(await(async w=>(
					await run(_=>(
					[...Array(s.y)].reduce((a,_,y)=>(
						[...Array(s.z)].reduce((a,_,z)=>(
							[...Array(s.x)].reduce((a,p,x)=>(
								p={x:x+o.x,y:y+o.y,z:z+o.z},
								sdf(p)<=0&&(b=>(
									b=b?BlockPermutation.resolve(...(Array.isArray(b)?b:[b])):null,
									w.setBlockPermutation({x,y,z},b)
								))(bf(p))
							),0)
						),0)
					),0)
					)),
					place?(
						world.structureManager.place(w.id,place.d,add(place.p,o)),
						world.structureManager.delete(w.id)
					):{s:w,p:o}
				))(world.structureManager.createEmpty(`${id}_${i}-${j}-${k}`,s))),
				a
			),[]))
		),[]))
	),[])
);



world.beforeEvents.chatSend.subscribe((
	e,p=e.sender,d=p.dimension,
	msg=e.message.match(/^\.(?<cmd>\S*)\s*(?<arg>.*)$/)?.groups,
	cmd={
		ping:x=>(
			p.sendMessage('pong')
		),
		sphere:r=>+r?run(async()=>(
			r=+r,
			await draw({
				size:(x=>({x,y:x,z:x}))(Math.floor(r*2)+1),
				sdf:p=>distance(p,(x=>({x,y:x,z:x}))(r))-r,
				bf:p=>`minecraft:${((a,x)=>(x*=a.length,Math.random()<x%1?a[x+1&15]:a[x&15]))(
					'white,light_gray,gray,black,red,yellow,lime,green,cyan,light_blue,blue,purple,magenta,brown,orange,pink'.split(','),
					Math.atan2(p.x-r+p.y-r,p.z-r+p.y-r)/Math.PI*.5+.5
				)}_stained_glass`
			},{place:p,msg:p}),
			p.sendMessage(`[  §aOK§r  ] sphere: Created sphere(r=${r}).`)
		)):p.sendMessage(`[§cFAILED§r] sphere: "${r}" is NaN or falsy value.`),
		octa:r=>+r?run(async w=>(
			r=+r,
			w=p=>dot(map(sub(p,(x=>({x,y:x,z:x}))(r)),x=>Math.abs(x)),{x:1,y:1,z:1})-r,
			await draw({
				size:(x=>({x,y:x,z:x}))(Math.floor(r*2)+1),
				sdf:w,
				bf:p=>(w(p)/r+1<.3)?'minecraft:sea_lantern':`minecraft:${Math.random()<.5?'light_blue':'cyan'}_stained_glass`
			},{place:p,msg:p}),
			p.sendMessage(`[  §aOK§r  ] octa: Created octa(r=${r}).`)
		)):p.sendMessage(`[§cFAILED§r] octa: "${r}" is NaN or falsy value.`),
		smin:k=>run(async()=>(
			await draw({
				size:{x:8,y:20,z:8},
				sdf:p=>smin(
					distance(p,{x:4,y: 4,z:4})-4,
					distance(p,{x:4,y:16,z:4})-4,
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
