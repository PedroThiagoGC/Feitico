import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("salons")
export class Salon {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text", nullable: true, unique: true })
  slug: string | null;

  @Column({ name: "logo_url", type: "text", nullable: true })
  logoUrl: string | null;

  @Column({ name: "hero_image_url", type: "text", nullable: true })
  heroImageUrl: string | null;

  @Column({ name: "primary_color", type: "text", default: "#C6A85C" })
  primaryColor: string;

  @Column({ type: "text", nullable: true })
  phone: string | null;

  @Column({ type: "text", nullable: true })
  whatsapp: string | null;

  @Column({ type: "text", nullable: true })
  address: string | null;

  @Column({ name: "about_text", type: "text", nullable: true })
  aboutText: string | null;

  @Column({ name: "video_url", type: "text", nullable: true })
  videoUrl: string | null;

  @Column({ type: "text", nullable: true })
  instagram: string | null;

  @Column({ type: "text", nullable: true })
  facebook: string | null;

  @Column({
    name: "opening_hours",
    type: "jsonb",
    default: () =>
      `'{"mon":"09:00-19:00","tue":"09:00-19:00","wed":"09:00-19:00","thu":"09:00-19:00","fri":"09:00-19:00","sat":"09:00-18:00","sun":"closed"}'`,
  })
  openingHours: Record<string, string>;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
