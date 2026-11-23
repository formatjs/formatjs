# @formatjs/fast-memoize

This is just a fork of `fast-memoize`.

Internal calls capture JavaScript intrinsics when this module loads. Later
replacement of those methods does not change memoizer execution. The default
serializer ignores inherited `toJSON` on its private argument wrappers; supplied
argument objects and arrays retain their own or inherited `toJSON` behavior.
Custom serializers still receive an ordinary argument Array in variadic mode.
For ordinary inputs, cache keys, strategy selection and bound context behavior
are preserved.
