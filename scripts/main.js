import{BlockPermutation,world,system}from'@minecraft/server';

const
cmd=(n,w,f)=>[
	{name:n,description:n,permissionLevel:1,mandatoryParameters:w},
	(o,...x)=>f(Object.assign(o,{arg:x.reduce((a,x,i)=>(a[w[i].name]=x,a),{})}))
];

system.beforeEvents.startup.subscribe(e=>[
	cmd('6ca:sphere',[
		{name:'center',type:'Location'},
		{name:'radius',type:'Float'},
		{name:'block',type:'BlockType'}
	],x=>console.log(JSON.stringify(x,0,'\t')))
].forEach(x=>e.customCommandRegistry.registerCommand(...x)))
