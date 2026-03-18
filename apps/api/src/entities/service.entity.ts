import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Salon } from "./salon.entity";

@Entity("services")
export class Service {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "salon_id", type: "uuid" })
  salonId: string;

  @ManyToOne(() => Salon, { onDelete: "CASCADE" })
  @JoinColumn({ name: "salon_id" })
  salon: Salon;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "numeric", precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: "integer", default: 30 })
  duration: number;

  @Column({ name: "buffer_minutes", type: "integer", default: 0 })
  bufferMinutes: number;

  @Column({ name: "image_url", type: "text", nullable: true })
  imageUrl: string | null;

  @Column({ type: "text", nullable: true })
  category: string | null;

  @Column({ name: "is_combo", type: "boolean", default: false })
  isCombo: boolean;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
