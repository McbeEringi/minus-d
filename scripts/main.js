import{BlockPermutation,world,system}from'@minecraft/server';

const
run=f=>new Promise(r=>system.run(_=>r(f()))),
//uuidgen=()=>Array.from('00000000-0000-4000-1000-000000000000',x=>([1,1][x]?y=>(+x?(y&3|8):y).toString(16):(_=>x))(Math.random()*16|0)).join(''),
a2o=([x,y,z])=>({x,y,z}),
o2a=({x,y,z})=>[x,y,z],

add=(a,b)=>a.map((x,i)=>x+b[i]),
sub=(a,b)=>a.map((x,i)=>x-b[i]),
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
	id=`minus-d:${Math.floor(Math.random()*0xffffffff).toString(16).padStart(8,0)}`,
	hc,hcl
}={})=>(
	place&&(place={d:place.dimension,p:o2a(place.location)}),
	hc=chunk.map(x=>x*.5),hcl=length(chunk)*.5,
	
	await[...Array(Math.ceil(size[1]/chunk[1]))].reduce(async(a,y,j,{length:l})=>(
		y=(j==l-1?size[1]-j*chunk[1]:chunk[1]),
		a=await a,
		msg&&msg.sendMessage(j?`${id} ${j}/${l} done...`:`${id} render started...`),
		a.concat(await[...Array(Math.ceil(size[2]/chunk[2]))].reduce(async(a,z,k,{length:l})=>(
			z=(k==l-1?size[2]-k*chunk[2]:chunk[2]),
			(await a).concat(await[...Array(Math.ceil(size[0]/chunk[0]))].reduce(async(a,s,i,{length:l},o)=>(
				s=[(i==l-1?size[0]-i*chunk[0]:chunk[0]),y,z],
				o=[i*chunk[0],j*chunk[1],k*chunk[2]],
				sdf(add(o,hc))<=hcl&&(infill||-hcl<=sdf(add(o,hc)))&&(await a).push(await(async w=>(
					await run(_=>(
						[...Array(s[1])].reduce((a,_,y)=>(
							[...Array(s[2])].reduce((a,_,z)=>(
								[...Array(s[0])].reduce((a,p,x)=>(
									p=[x+o[0],y+o[1],z+o[2]],
									sdf(p)<=0&&(b=>(
										b=b?BlockPermutation.resolve(...(Array.isArray(b)?b:[b])):null,
										w.setBlockPermutation({x,y,z},b)
									))(bf(p))
								),0)
							),0)
						),0)
					)),
					place?(
						world.structureManager.place(w.id,place.d,a2o(add(place.p,o))),
						world.structureManager.delete(w.id)
					):{s:w,p:o}
				))(world.structureManager.createEmpty(`${id}_${i}-${j}-${k}`,a2o(s)))),
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
				size:(x=>[x,x,x])(Math.floor(r*2)+1),
				sdf:p=>distance(p,(x=>[x,x,x])(r))-r,
				bf:p=>`minecraft:${((a,x)=>(x*=a.length,Math.random()<x%1?a[x+1&15]:a[x&15]))(
					'white,light_gray,gray,black,red,yellow,lime,green,cyan,light_blue,blue,purple,magenta,brown,orange,pink'.split(','),
					Math.atan2(p[0]-r+p[1]-r,p[2]-r+p[2]-r)/Math.PI*.5+.5
				)}_stained_glass`
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
