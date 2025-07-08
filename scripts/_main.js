import{BlockPermutation,world,system}from'@minecraft/server';

const
run=f=>new Promise(r=>system.run(_=>r(f()))),
//uuidgen=()=>Array.from('00000000-0000-4000-1000-000000000000',x=>([1,1][x]?y=>(+x?(y&3|8):y).toString(16):(_=>x))(Math.random()*16|0)).join(''),
a2o=([x,y,z])=>({x,y,z}),
o2a=({x,y,z})=>[x,y,z],

fill=w=>new Proxy({},{get:_=>w}),
v0=fill(0),
add=(a,b)=>a.map((x,i)=>x+b[i]),
sub=(a,b)=>a.map((x,i)=>x-b[i]),
mul=(a,b)=>a.map((x,i)=>x*b[i]),
div=(a,b)=>a.map((x,i)=>x/b[i]),
max=(a,b)=>a.map((x,i)=>Math.max(x,b[i])),
min=(a,b)=>a.map((x,i)=>Math.min(x,b[i])),
fclamp=(w,a,b)=>Math.min(Math.max(w,a),b),
clamp=(w,a,b)=>w.map((x,i)=>fclamp(x,a[i],b[i])),
fmix=(a,b,w)=>a*(1-w)+b*w,
mix=(a,b,w)=>a.map((x,i)=>fmix(x,b[i],w[i])),
flip=w=>w.map(x=>-x),
abs=w=>w.map(x=>Math.abs(x)),
floor=w=>w.map(x=>Math.floor(x)),
fract=w=>w.map(x=>x-Math.floor(x)),
ceil=w=>w.map(x=>Math.ceil(x)),
length=w=>w.reduce((a,x)=>a+x*x,0)**.5,
lenn=(w,n)=>w.reduce((a,x)=>a+x**n,0)**(1/n),
distance=(a,b)=>length(sub(a,b)),
dot=(a,b)=>a.reduce((a,x,i)=>a+x*b[i],0),
dote=w=>w.reduce((a,x)=>a+x,0),

sd=(w=>Object.assign(w,{// https://iquilezles.org/articles/distfunctions/
	op:{
		// 2d 2 3d
		rext:({prim,o})=>p=>prim([length([p[0],p[2]])-o,p[1]]),
		ext:({prim,h})=>p=>(q=>Math.min(Math.max(...q),0)+length(max(q,v0)))([prim([p[0],p[2]]),Math.abs(p[1])-h]),
		// 3d 2 3d
		elong:({prim,h})=>p=>prim(sub(p,clamp(p,flip(h),h))),
		r:({prim,r})=>p=>prim(p)-r,
		oni:({prim,t})=>p=>Math.abs(prim(p))-t
	},
	b:{// boolean
		uni:Math.min,
		dif:(a,...b)=>Math.max(a,...b.map(x=>-x)),
		int:Math.max,
		xor:(a,b)=>Math.max(Math.min(a,b),-Math.max(a,b)),

		suni:(d1,d2,k)=>(h=>fmix( d2,d1,h)-k*h*(1-h))(fclamp(.5+.5*(d2-d1)/k,0,1)),
		sdif:(d1,d2,k)=>(h=>fmix(-d2,d1,h)-k*h*(1-h))(fclamp(.5-.5*(d2+d1)/k,0,1)),
		sint:(d1,d2,k)=>(h=>fmix( d2,d1,h)-k*h*(1-h))(fclamp(.5-.5*(d2-d1)/k,0,1)),
	},

	// prims
	sphere:({s})=>w.op.r({prim:length,r:s}),circle:(...x)=>w.sphere(...x),
	box:({b})=>p=>(q=>length(max(q,v0))+Math.min(Math.max(...q),0))(sub(abs(p),b)),
	rbox:({b,r})=>w.op.r({prim:w.box({b:sub(b,fill(r))}),r}),
	//fbox:({b,e})=>p=>0,
	torus:({t})=>w.op.rext({prim:w.circle({s:t[1]}),o:t[0]}),
	ctorus:({t,a})=>(a=[Math.sin(a),Math.cos(a)],p=>(
		p=[Math.abs(p[0]),p[1],p[2]],
		(dot(p,p)+t[0]*t[0]-2*t[0]*((a[1]*p[0]>a[0]*p[1])?dot([p[0],p[1]],a):length([p[0],p[1]])))**.5-t[1]
	)),
	link:({t,h})=>w.op.elong({prim:w.torus({t}),h}),
	cone:({q})=>p=>((
		w=[length([p[0],p[2]]),p[1]],
		a=sub(w,mul(q,fill(fclamp(dot(w,q)/dot(q,q),0,1)))),
		b=sub(w,mul(q,[fclamp(w[0]/q[0],0,1),1])),
		k=Math.sign(q[1])
	)=>(Math.min(dot(a,a),dot(b,b))**.5*Math.sign(Math.max(k*(w[0]*q[1]-w[1]*q[0]),k*(w[1]-q[1])))))(),
	line:({a,b,r})=>p=>((pa=sub(p,a),ba=sub(b,a))=>
		length(sub(pa,mul(ba,fill(fclamp(dot(pa,ba)/dot(ba,ba),0,1)))))-r
	)(),
	cylinder:({h,r})=>w.op.ext({prim:w.circle({s:r}),h}),
	octa:({s})=>p=>Math.abs(dote(sub(p,[s,s,s])))-s// TODO
}))({}),

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
	spc=ceil(div(size,chunk)),
	
	await[1,2,0].reduce((a,i,l)=>(
		l=[...Array(spc[i])],
		[].concat(...a.map(x=>l.map(({s,o}=0,j,{length:l})=>(
			s=(s=>(s[i]=j==l-1?size[i]-chunk[i]*j:chunk[i],s))(x.s?.slice()??[]),
			o=(o=>(o[i]=j*chunk[i],o))(x.o?.slice()??[]),
			{s,o,d:sdf(add(o,hc))}
		))))
	),[0]).reduce((a,x,i)=>(
		x.d<=hcl&&(infill||-hcl<=x.d)&&(i=-hcl<=x.d?0:1,a[i]??=[],a[i].push(x)),
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
			),[0]).forEach((q,d)=>(
				(d=sdf(q.g))<=0&&(b=>(
					b=b?BlockPermutation.resolve(...(Array.isArray(b)?b:[b])):null,
					w.setBlockPermutation(a2o(q.l),b)
				))(bf(q.g,d,sdf))
			))),
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
		ping:x=>p.sendMessage('pong'),
		draw:w=>run(_=>(async x=>(
			w=JSON.parse(w),
			w={
				size:[8,8,8],
				block:'white_stained_glass',
				...w,
				sdf:{name:'sphere',arg:{s:3},...(w.sdf||{})}
			},
			x=div(w.size,fill(2)),
			await draw({
				size:w.size,
				sdf:p=>sd[w.sdf.name](w.sdf.arg)(sub(p,x)),
				bf:(p,d)=>w.block
			},{
				place:{
					dimension:p.dimension,
					location:a2o(sub(o2a(p.location),x))
				},
				msg:p
			}),
			p.sendMessage(`[  §aOK§r  ] draw: ${JSON.stringify(w)}.`)
		))().catch(e=>p.sendMessage(`[§cFAILED§r] draw: ${e}`))),
		//bf:(p,d)=>`minecraft:${((a,x)=>(x*=a.length,Math.random()<x%1?a[x+1&15]:a[x&15]))(
		//	'white,light_gray,gray,black,red,yellow,lime,green,cyan,light_blue,blue,purple,magenta,brown,orange,pink'.split(','),
		//	Math.atan2(p[0]-r+p[1]-r,p[2]-r+p[1]-r)/Math.PI*.5+.5
		//)}_${d/r+1<.7?'concrete':'stained_glass'}`
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
