# STILL IN EARLY DEVELOPMENT. USE AT YOUR OWN RISK!

# MINUS_D
![icon](pack_icon.png)
MINUS_D is a script pack for Minecraft Bedrock to draw object defined in Signed Distance Function(SDF).

## USAGE

### `.draw`

open chat, type

```
.draw {}
```

then you will get r=3 sphere.

#### Option Props

- size *Array[3]*
    max draw size.
    default: `[8,8,8]`
- block *BlockName (String)*
    block to draw with.
    default `"white_stained_glass"`
- sdf
    - name *SDFName (String)*
        predefined SDF name.
        default: `"sphere"`
    - arg *SDFArg (Object)*
        SDF arguments. depends on SDF name.
        defaulr: `{"s":3}`

#### Predifined SDFs

- `sphere`: sphere
    - `s` *Number*: radius of sphere.
- `box`: box
    - `b` *Array[3]*: size of box. `[2,3,4]` makes width=4,height=6,depth=8.
- `rbox`: rounded box
    - `b` *Array[3]*: same as `box`.
    - `r` *Number*: round radius of rounded box
- `torus`: torus
    - `t` *Array[2]*: distance from origin to ring center & radius(thickness) of ring.
- `ctorus`: capped torus
    - `t` *Array[2]*: same as `torus`.
    - `a` *Number*: angle of arc in radians.
- `link`: elongated torus
    - `t` *Array[2]*: same as `torus`.
    - `h` *Array[3]*: elongate length for each axes.
- `cone`: cone
    - `q` *Array[2]*: radius of base & height.
- `line`: capped cylinder
    - `a` *Array[3]*: line start position.
    - `b` *Array[3]*: line end position.
    - `r` *Number*: radius(thickness) of line.
- `cylinder`: cylinder
    - `h` *Number*: half height of cylinder.
    - `r` *Number*: rasius of cylinder.
- `octa`: octahedron
    - `s` *Number*: radius of octahedron.

### `.info`
show block properties of block at players position.

### `.s`
#### `.s l`
list all structures in the world.

#### `.s c`
delete all structures in the world.

### `.ping`
returns "pong" message.
