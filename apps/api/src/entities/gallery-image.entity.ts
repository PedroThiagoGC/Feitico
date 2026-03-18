import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Salon } from "./salon.entity";

@Entity("gallery_images")
export class GalleryImage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "salon_id", type: "uuid" })
  salonId: string;

  @ManyToOne(() => Salon, { onDelete: "CASCADE" })
  @JoinColumn({ name: "salon_id" })
  salon: Salon;

  @Column({ name: "image_url", type: "text" })
  imageUrl: string;

  @Column({ type: "text", nullable: true })
  caption: string | null;

  @Column({ name: "sort_order", type: "integer", default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
