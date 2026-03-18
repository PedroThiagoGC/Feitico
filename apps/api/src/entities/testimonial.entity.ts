import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Salon } from "./salon.entity";

@Entity("testimonials")
export class Testimonial {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "salon_id", type: "uuid" })
  salonId: string;

  @ManyToOne(() => Salon, { onDelete: "CASCADE" })
  @JoinColumn({ name: "salon_id" })
  salon: Salon;

  @Column({ name: "author_name", type: "text" })
  authorName: string;

  @Column({ name: "author_image", type: "text", nullable: true })
  authorImage: string | null;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "integer", nullable: true, default: 5 })
  rating: number | null;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
