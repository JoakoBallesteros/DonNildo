-- ROLES
create table if not exists roles (
  id_rol serial primary key,
  nombre text not null unique,
  descripcion text
);

-- USUARIOS
create table if not exists usuarios (
  id_usuario serial primary key,
  dni text unique,
  nombre text not null,
  hash_contrasena text not null,
  mail text not null unique,
  id_rol int not null references roles(id_rol) on delete restrict,
  estado text not null default 'ACTIVO',
  created_at timestamp default now()
);

create index if not exists idx_usuarios_mail on usuarios(mail);
create index if not exists idx_usuarios_estado on usuarios(estado);